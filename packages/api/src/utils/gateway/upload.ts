import { GatewayConfig, UploadOptions, UploadResponse } from "@cessnetwork/types";
import { ReadStream } from "fs";


type FileInput = string | Buffer | ReadStream;

// Gateway API endpoints
export const GATEWAY_UPLOADFILE_URL = "/gateway/upload/file";
export const GATEWAY_BATCHUPLOAD_URL = "/gateway/upload/batch/file";
export const GATEWAY_BATCHREQUEST_URL = "/gateway/upload/batch/request";
export const DEFAULT_CHUNK_SIZE = 100 * 1024 * 1024; // 100MB
export const MAX_CONCURRENT_UPLOADS = 4;

export interface BatchFilesInfo {
    fileName: string;
    territory: string;
    totalSize: number;
    encrypt: boolean;
    asyncUpload: boolean;
    noTxProxy: boolean;
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
 * Upload a single file to gateway
 */
export async function uploadFile(
    config: GatewayConfig,
    fileInput: FileInput,
    options: UploadOptions
): Promise<UploadResponse> {
    verifyUploadConfig(config);
    verifyUploadOptions(options);
    const baseUrl = config.baseUrl.replace(/\/$/, "");
    const timeout = config.timeout || 60000;

    try {
        const formData = await createFormData(fileInput, options);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        try {
            const response = await fetch(`${baseUrl}${GATEWAY_UPLOADFILE_URL}`, {
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
export async function requestBatchUpload(
    config: GatewayConfig,
    territory: string,
    filename: string,
    fileSize: number,
    encrypt: boolean = false,
    asyncUpload: boolean = true,
    noTxProxy: boolean = false
): Promise<{ hash: string; error?: string }> {
    const baseUrl = config.baseUrl.replace(/\/$/, "");

    const batchInfo: BatchFilesInfo = {
        fileName: filename,
        territory: territory,
        totalSize: fileSize,
        encrypt: encrypt,
        asyncUpload: asyncUpload,
        noTxProxy: noTxProxy,
    };

    try {
        const response = await fetch(`${baseUrl}${GATEWAY_BATCHREQUEST_URL}`, {
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

        const result = await response.json() as unknown as any;

        return {hash: result.data};
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
        return {hash: "", error: `Request batch upload error: ${errorMessage}`};
    }
}

/**
 * Upload a single chunk - matches Go implementation
 */
export async function batchUploadFile(
    config: GatewayConfig,
    hash: string,
    fileBuffer: ArrayBuffer | Buffer,
    start: number,
    end: number
): Promise<{ result: string; error?: string }> {
    const baseUrl = config.baseUrl.replace(/\/$/, "");

    // Validate byte range
    if (start >= end || end <= 0 || start < 0) {
        return {result: "", error: "Bad content bytes range"};
    }

    try {
        // Extract chunk from buffer
        const chunk = fileBuffer.slice(start, end);

        if (chunk.byteLength !== (end - start)) {
            return {result: "", error: "Invalid data length"};
        }

        // Create FormData with file part
        const formData = new FormData();
        const blob = new Blob([chunk]);
        formData.append("file", blob, "part");

        const response = await fetch(`${baseUrl}${GATEWAY_BATCHUPLOAD_URL}`, {
            method: "POST",
            headers: {
                "token": `Bearer ${config.token}`,
                "Range": `bytes=${start}-${end}`,
                "hash": hash,
            },
            body: formData,
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }


        const result = await response.json() as unknown as any;
        return {result: String(result.data)};
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
        return {result: "", error: `Batch upload file error: ${errorMessage}`};
    }
}

/**
 * Upload large file in chunks with parallel processing and progress tracking
 */
export async function uploadLargeFile(
    config: GatewayConfig,
    file: File | ArrayBuffer | Buffer,
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
        asyncUpload = true,
        noTxProxy = false,
        onProgress,
    } = options;

    try {
        // Convert file to buffer
        let fileBuffer: ArrayBuffer;
        let actualFilename: string;

        if (file instanceof File) {
            fileBuffer = await file.arrayBuffer();
            actualFilename = filename || file.name;
        } else {
            fileBuffer = file;
            actualFilename = filename || "unknown";
        }

        const fileSize = fileBuffer.byteLength;

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

        const hash = sessionResult.hash;
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
            success: true,
            data: {
                message: "File uploaded successfully",
                hash: hash,
                totalChunks: totalChunks,
                fileSize: fileSize,
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
export async function uploadLargeFileWithRetry(
    config: GatewayConfig,
    file: File | ArrayBuffer | Buffer,
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
    verifyUploadConfig(config);

    const {maxRetries = 3, retryDelay = 1000, onRetry, ...uploadOptions} = options;

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            const result = await uploadLargeFile(config, file, territory, filename, uploadOptions);

            if (result.success) {
                return result;
            }

            lastError = new Error(result.error || "Upload failed");

            if (attempt < maxRetries) {
                if (onRetry) {
                    onRetry(-1, attempt + 1); // -1 indicates overall retry
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
        // File path - need to read file (Node.js environment)
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
        // Dynamic import to avoid issues in browser environment
        const fs = await import('fs/promises');
        return await fs.readFile(filePath);
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
    try {
        // Dynamic import for path module
        const path = require('path');
        return path.basename(filePath);
    } catch {
        // Fallback for browser environment
        return filePath.split(/[/\\]/).pop() || generateDefaultFilename();
    }
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
function createHeaders(token: string): Record<string, string> {
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

// Optional: Utility function for batch uploads with progress tracking
export interface UploadProgress {
    loaded: number;
    total: number;
    percentage: number;
    file: string;
}

export async function uploadFileWithProgress(
    config: GatewayConfig,
    fileInput: FileInput,
    options: UploadOptions,
    onProgress?: (progress: UploadProgress) => void
): Promise<UploadResponse> {
    // Implementation would use XMLHttpRequest for progress tracking
    // This is a placeholder showing the interface
    return uploadFile(config, fileInput, options);
}