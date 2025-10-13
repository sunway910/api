import { GatewayConfig, UploadOptions, UploadResponse } from "@cessnetwork/types";
import { ReadStream } from "fs";
import { readFile, stat } from "fs/promises";
import { basename } from "path";

type FileInput = string | Buffer | ReadStream | File;

// Gateway API endpoints
export const GATEWAY_UPLOAD_FILE_URL = "/gateway/upload/file"; // Simple upload
export const GATEWAY_BATCH_UPLOAD_URL = "/gateway/upload/batch/file"; // Chunk upload
export const GATEWAY_BATCH_REQUEST_URL = "/gateway/upload/batch/request"; // Initialize chunk upload request
export const DEFAULT_CHUNK_SIZE = 100 * 1024 * 1024; // 100MB
export const MAX_CONCURRENT_UPLOADS = 4;
export const DEFAULT_FILE_SIZE_THRESHOLD = 100 * 1024 * 1024; // 100MB threshold for batch upload

export interface BatchFilesInfo {
    file_name: string;
    territory: string;
    total_size: number;
    encrypt: boolean;
    async_upload: boolean;
    no_tx_proxy: boolean;
}

export interface UploadProgress {
    loaded: number;
    total: number;
    percentage: number;
    file: string;
}

export interface UploadOptionsExtended extends UploadOptions {
    isBatchUpload?: boolean; // Force batch upload regardless of file size
    uploadFileWithProgress?: (progress: UploadProgress) => void; // Progress callback
    uploadFileWithRetry?: number; // Number of retries, default 3
    chunkSize?: number; // Chunk size for batch upload
    maxConcurrent?: number; // Max concurrent uploads for batch
    retryDelay?: number; // Delay between retries in ms
    onRetry?: (chunkIndex: number, attempt: number) => void; // Retry callback
}

function verifyUploadConfig(config: GatewayConfig) {
    if (!config?.token?.trim()) {
        throw new Error("Token is required when uploading file to gateway: INVALID_TOKEN");
    }
    if (!config?.baseUrl?.trim()) {
        throw new Error("Base URL is required: INVALID_BASE_URL");
    }
}

function verifyUploadOptions(options: UploadOptions) {
    if (!options?.territory?.trim()) {
        throw new Error("Territory is required: INVALID_TERRITORY");
    }
}

/**
 * Convert Buffer to ArrayBuffer
 */
function bufferToArrayBuffer(buffer: Buffer): ArrayBuffer {
    const arrayBuffer = new ArrayBuffer(buffer.length);
    const view = new Uint8Array(arrayBuffer);
    for (let i = 0; i < buffer.length; ++i) {
        view[i] = buffer[i];
    }
    return arrayBuffer;
}

/**
 * Unified upload method that handles both simple and batch uploads
 * Automatically switches to batch upload for files > 100MB or when isBatchUpload is true
 */
export async function upload(
    config: GatewayConfig,
    fileInput: FileInput,
    options: UploadOptionsExtended
): Promise<UploadResponse> {
    verifyUploadConfig(config);
    verifyUploadOptions(options);

    const {
        isBatchUpload = false,
        uploadFileWithProgress,
        uploadFileWithRetry = 3,
        chunkSize = DEFAULT_CHUNK_SIZE,
        maxConcurrent = MAX_CONCURRENT_UPLOADS,
        retryDelay = 1000,
        onRetry,
        ...baseOptions
    } = options;

    try {
        // Get file size to determine upload method
        const fileSize = await getFileSize(fileInput);
        const shouldUseBatchUpload = isBatchUpload || fileSize > DEFAULT_FILE_SIZE_THRESHOLD;

        if (shouldUseBatchUpload) {
            // Use batch upload with retry mechanism
            return await uploadLargeFileWithRetry(
                config,
                fileInput,
                baseOptions.territory,
                baseOptions.filename,
                {
                    chunkSize,
                    maxConcurrent,
                    maxRetries: uploadFileWithRetry,
                    retryDelay,
                    encrypt: baseOptions.encrypt,
                    asyncUpload: baseOptions.async,
                    noTxProxy: baseOptions.noProxy,
                    onProgress: uploadFileWithProgress ? (progress) => {
                        uploadFileWithProgress({
                            loaded: progress.uploaded,
                            total: progress.total,
                            percentage: progress.percentage,
                            file: baseOptions.filename || 'unknown'
                        });
                    } : undefined,
                    onRetry
                }
            );
        } else {
            // Use simple upload with retry mechanism
            return await uploadFileWithRetryMechanism(
                config,
                fileInput,
                baseOptions,
                uploadFileWithRetry,
                retryDelay,
                uploadFileWithProgress,
                onRetry
            );
        }
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error occurred"
        };
    }
}

/**
 * Get file size from different input types
 */
async function getFileSize(fileInput: FileInput): Promise<number> {
    if (fileInput instanceof File) {
        return fileInput.size;
    }

    if (Buffer.isBuffer(fileInput)) {
        return fileInput.length;
    }

    if (typeof fileInput === 'string') {
        try {
            const stats = await stat(fileInput);
            return stats.size;
        } catch (error) {
            throw new Error(`Failed to get file size: ${error}`);
        }
    }

    // For ReadStream, we'll need to read it to get size
    // This is a simplified approach - in practice you might want to handle this differently
    throw new Error("Cannot determine file size for ReadStream. Please use File or Buffer input.");
}

/**
 * Simple upload with retry mechanism and progress
 */
async function uploadFileWithRetryMechanism(
    config: GatewayConfig,
    fileInput: FileInput,
    options: UploadOptions,
    maxRetries: number,
    retryDelay: number,
    onProgress?: (progress: UploadProgress) => void,
    onRetry?: (chunkIndex: number, attempt: number) => void
): Promise<UploadResponse> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            const result = await uploadFileSimple(config, fileInput, options, onProgress);

            if (result.code == 200) {
                return result;
            }

            lastError = new Error(result.error || "Upload failed");

            if (attempt < maxRetries) {
                if (onRetry) {
                    onRetry(-1, attempt + 1); // -1 indicates overall retry for simple upload
                }
                await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
            }

        } catch (error) {
            lastError = error instanceof Error ? error : new Error("Unknown error");

            if (attempt < maxRetries) {
                if (onRetry) {
                    onRetry(-1, attempt + 1);
                }
                await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
            }
        }
    }

    return {
        success: false,
        error: `Upload failed after ${maxRetries + 1} attempts: ${lastError?.message || "Unknown error"}`,
    };
}

/**
 * Simple file upload with progress support
 */
async function uploadFileSimple(
    config: GatewayConfig,
    fileInput: FileInput,
    options: UploadOptions,
    onProgress?: (progress: UploadProgress) => void
): Promise<UploadResponse> {
    const baseUrl = config.baseUrl.replace(/\/$/, "");
    const timeout = config.timeout || 60000;

    try {
        const formData = await createFormData(fileInput, options);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        // Simulate progress for simple upload if callback is provided
        if (onProgress) {
            const fileSize = await getFileSize(fileInput);
            const filename = options.filename || 'unknown';

            onProgress({loaded: 0, total: fileSize, percentage: 0, file: filename});
        }

        try {
            const response = await fetch(`${baseUrl}${GATEWAY_UPLOAD_FILE_URL}`, {
                method: "POST",
                headers: createHeaders(config.token),
                body: formData,
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            // Handle HTTP errors
            if (!response.ok) {
                const errorText = await response.text().catch(() => 'Unknown error');
                throw new Error(
                    `HTTP ${response.status}: ${response.statusText}. ${errorText}: HTTP_${response.status}`
                );
            }

            // Update progress to 100% on success
            if (onProgress) {
                const fileSize = await getFileSize(fileInput);
                const filename = options.filename || 'unknown';
                onProgress({loaded: fileSize, total: fileSize, percentage: 100, file: filename});
            }

            // Parse response with proper error handling
            return await parseResponse(response);

        } finally {
            clearTimeout(timeoutId);
        }

    } catch (error) {
        throw new Error(`Failed to upload file: ${error}`);
    }
}

/**
 * Request batch upload session - matches Go implementation
 */
async function requestBatchUpload(
    config: GatewayConfig,
    territory: string,
    filename: string,
    fileSize: number,
    encrypt: boolean = false,
    asyncUpload: boolean = true,
    noTxProxy: boolean = false
): Promise<UploadResponse> {
    const baseUrl = config.baseUrl.replace(/\/$/, "");

    const batchInfo: BatchFilesInfo = {
        file_name: filename,
        territory: territory,
        total_size: fileSize,
        encrypt: encrypt,
        async_upload: asyncUpload,
        no_tx_proxy: noTxProxy,
    };

    try {
        const response = await fetch(`${baseUrl}${GATEWAY_BATCH_REQUEST_URL}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "token": `Bearer ${config.token}`,
            },
            body: JSON.stringify(batchInfo),
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return await parseResponse(response);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
        return {error: `Request batch upload error: ${errorMessage}`};
    }
}

/**
 * Upload a single chunk - matches Go implementation
 */
async function batchUploadFile(
    config: GatewayConfig,
    hash: string,
    fileBuffer: ArrayBuffer,
    start: number,
    end: number
): Promise<UploadResponse> {
    const baseUrl = config.baseUrl.replace(/\/$/, "");

    // Validate byte range
    if (start >= end || end <= 0 || start < 0) {
        return {error: "Bad content bytes range"};
    }

    try {
        // Extract chunk from buffer
        const chunk = fileBuffer.slice(start, end);

        if (chunk.byteLength !== (end - start)) {
            return {error: "Invalid data length"};
        }

        // Create FormData with file part
        const formData = new FormData();
        const blob = new Blob([chunk]);
        formData.append("file", blob, "part");

        const response = await fetch(`${baseUrl}${GATEWAY_BATCH_UPLOAD_URL}`, {
            method: "POST",
            headers: {
                "token": `Bearer ${config.token}`,
                "Range": `bytes=${start}-${end}`,
                "hash": hash,
            },
            body: formData,
        });
        if (!response.ok && response.status !== 308) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return parseResponse(response);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
        return {error: `Batch upload file error: ${errorMessage}`};
    }
}

/**
 * Upload large file in chunks with parallel processing and progress tracking
 */
async function uploadLargeFile(
    config: GatewayConfig,
    file: FileInput,
    territory: string,
    filename?: string,
    options: {
        chunkSize?: number;
        maxConcurrent?: number;
        encrypt?: boolean;
        asyncUpload?: boolean;
        noTxProxy?: boolean;
        onProgress?: (progress: { uploaded: number; total: number; percentage: number }) => void;
    } = {}
): Promise<UploadResponse> {
    const {
        chunkSize = DEFAULT_CHUNK_SIZE,
        maxConcurrent = MAX_CONCURRENT_UPLOADS,
        encrypt = false,
        asyncUpload = false,
        noTxProxy = false,
        onProgress,
    } = options;

    try {
        // Convert file to ArrayBuffer
        let fileBuffer: ArrayBuffer;
        let actualFilename: string;

        if (file instanceof File) {
            fileBuffer = await file.arrayBuffer();
            actualFilename = filename || file.name;
        } else if (Buffer.isBuffer(file)) {
            fileBuffer = bufferToArrayBuffer(file);
            actualFilename = filename || "unknown";
        } else if (typeof file === 'string') {
            const buffer = await readFile(file);
            fileBuffer = bufferToArrayBuffer(buffer);
            actualFilename = filename || extractFilenameFromPath(file);
        } else {
            throw new Error("Unsupported file input type for batch upload");
        }

        const fileSize = fileBuffer.byteLength;
        let fid = ""

        // Step 1: Request batch upload session
        const sessionResult = await requestBatchUpload(
            config,
            territory,
            actualFilename,
            fileSize,
            encrypt,
            asyncUpload,
            noTxProxy
        );

        if (sessionResult.error) {
            return {
                success: false,
                error: sessionResult.error,
            };
        }

        const hash = sessionResult.data;
        const totalChunks = Math.ceil(fileSize / chunkSize);
        let uploadedBytes = 0;

        // Step 2: Upload chunks with parallel processing
        const chunks: Array<{ start: number; end: number; index: number }> = [];

        for (let i = 0; i < totalChunks; i++) {
            const start = i * chunkSize;
            const end = Math.min(start + chunkSize, fileSize);
            chunks.push({start, end, index: i});
        }

        // Process chunks in parallel with concurrency limit
        const uploadChunk = async (chunk: { start: number; end: number; index: number }) => {
            const result = await batchUploadFile(config, hash, fileBuffer, chunk.start, chunk.end);

            if (result.error) {
                throw new Error(`Chunk ${chunk.index} upload failed: ${result.error}`);
            }

            uploadedBytes += (chunk.end - chunk.start);

            if (onProgress) {
                onProgress({
                    uploaded: uploadedBytes,
                    total: fileSize,
                    percentage: Math.round((uploadedBytes / fileSize) * 100),
                });
            }
            if (result.data.fid) {
                fid = result.data.fid
            }

            return result;
        };

        // Process chunks with concurrency control
        const results = [];
        for (let i = 0; i < chunks.length; i += maxConcurrent) {
            const batch = chunks.slice(i, i + maxConcurrent);
            const batchPromises = batch.map(uploadChunk);
            const batchResults = await Promise.all(batchPromises);
            results.push(...batchResults);
        }


        return {
            code: 200,
            success: true,
            data: {
                message: "File uploaded successfully",
                hash: hash,
                totalChunks: totalChunks,
                fileSize: fileSize,
                fid: fid
            },
        };

    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error occurred",
        };
    }
}

/**
 * Enhanced upload with retry mechanism
 */
async function uploadLargeFileWithRetry(
    config: GatewayConfig,
    file: FileInput,
    territory: string,
    filename?: string,
    options: {
        chunkSize?: number;
        maxConcurrent?: number;
        maxRetries?: number;
        retryDelay?: number;
        encrypt?: boolean;
        asyncUpload?: boolean;
        noTxProxy?: boolean;
        onProgress?: (progress: { uploaded: number; total: number; percentage: number }) => void;
        onRetry?: (chunkIndex: number, attempt: number) => void;
    } = {}
): Promise<UploadResponse> {
    const {maxRetries = 3, retryDelay = 1000, onRetry, ...uploadOptions} = options;

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            const result = await uploadLargeFile(config, file, territory, filename, uploadOptions);

            if (result.code == 200) {
                return result;
            }

            lastError = new Error(result.error || "Upload failed");

            if (attempt < maxRetries) {
                if (onRetry) {
                    onRetry(-1, attempt + 1);
                }
                await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
            }

        } catch (error) {
            lastError = error instanceof Error ? error : new Error("Unknown error");

            if (attempt < maxRetries) {
                if (onRetry) {
                    onRetry(-1, attempt + 1);
                }
                await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
            }
        }
    }

    return {
        success: false,
        error: `Upload failed after ${maxRetries + 1} attempts: ${lastError?.message || "Unknown error"}`,
    };
}

async function createFormData(fileInput: FileInput, options: UploadOptions): Promise<FormData> {
    const formData = new FormData();

    // Add file to FormData
    const {file, fileName} = await processFileInput(fileInput, options.filename);
    formData.append("file", file, fileName);

    // Add other parameters (similar to Go version)
    const params: Record<string, string> = {
        territory: options.territory,
    };

    // Add optional boolean parameters only if true
    if (options.async) params.async = "true";
    if (options.noProxy) params.noProxy = "true";
    if (options.encrypt) params.encrypt = "true";

    // Add filename if explicitly provided
    if (options.filename) {
        params.filename = options.filename;
    }

    // Append all parameters to FormData
    Object.entries(params).forEach(([key, value]) => {
        formData.append(key, value);
    });

    return formData;
}

/**
 * Process different types of file input
 */
async function processFileInput(
    fileInput: FileInput,
    explicitFilename?: string
): Promise<{ file: File | Blob; fileName: string }> {

    if (fileInput instanceof File) {
        return {
            file: fileInput,
            fileName: explicitFilename || fileInput.name || generateDefaultFilename()
        };
    }

    if (fileInput instanceof Blob) {
        return {
            file: fileInput,
            fileName: explicitFilename || generateDefaultFilename()
        };
    }

    if (typeof fileInput === 'string') {
        const fileBuffer = await readFileFromPath(fileInput);
        const fileName = explicitFilename || extractFilenameFromPath(fileInput);
        return {
            file: new File([fileBuffer], fileName),
            fileName
        };
    }

    if (Buffer.isBuffer(fileInput)) {
        const fileName = explicitFilename || generateDefaultFilename();
        return {
            file: new File([fileInput], fileName),
            fileName
        };
    }

    throw new Error("Unsupported file input type: INVALID_FILE_INPUT");
}

/**
 * Read file from file path (Node.js environment)
 */
async function readFileFromPath(filePath: string): Promise<Buffer> {
    try {
        return await readFile(filePath);
    } catch (error) {
        throw new Error(
            `Failed to read file from path: ${filePath}: FILE_READ_ERROR`
        );
    }
}

/**
 * Extract filename from file path
 */
function extractFilenameFromPath(filePath: string): string {
    return basename(filePath);
}

/**
 * Generate default filename with timestamp
 */
function generateDefaultFilename(): string {
    return `upload_${Date.now()}.bin`;
}

/**
 * Create HTTP headers (following Go version pattern)
 */
function createHeaders(token: string | undefined): Record<string, string> {
    if (!token) {
        throw new Error("Token is required");
    }
    return {
        "Token": `Bearer ${token}`, // Matching Go version format
    };
}

/**
 * Parse response with proper error handling
 */
async function parseResponse(response: Response): Promise<UploadResponse> {
    try {
        const contentType = response.headers.get('content-type');

        if (contentType?.includes('application/json')) {
            const data = await response.json();
            return data as UploadResponse;
        } else {
            // Handle non-JSON response
            const text = await response.text();
            return {
                success: true,
                data: text
            };
        }
    } catch (error) {
        throw new Error("Failed to parse response: PARSE_ERROR");
    }
}