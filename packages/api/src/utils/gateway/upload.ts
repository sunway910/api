import { GatewayConfig, UploadOptions, UploadResponse } from "@cessnetwork/types";
import { ReadStream } from "fs";
import { readFile, stat } from "fs/promises";
import { basename } from "path";
import { verifyUploadConfig, verifyUploadOptions } from "@/utils";
import { Blob } from 'buffer';
import { sleep } from "@cessnetwork/util";

// Define the allowed types for file input
type FileInput = string | Buffer | ReadStream;

// Gateway API endpoints
export const GATEWAY_UPLOAD_FILE_URL = "/gateway/upload/file"; // Simple upload
export const GATEWAY_BATCH_UPLOAD_URL = "/gateway/upload/batch/file"; // Chunk upload
export const GATEWAY_BATCH_REQUEST_URL = "/gateway/upload/batch/request"; // Initialize chunk upload request

// Constants for upload configuration
export const DEFAULT_CHUNK_SIZE = 100 * 1024 * 1024; // 100MB
export const MAX_CONCURRENT_UPLOADS = 4;
export const DEFAULT_FILE_SIZE_THRESHOLD = 100 * 1024 * 1024; // 100MB threshold for batch upload

// Interface for batch file upload information
export interface BatchFilesInfo {
    file_name: string; // Name of the file to upload
    territory: string; // Storage territory for the file
    total_size: number; // Total size of the file in bytes
    encrypt: boolean; // Whether to encrypt the file
    async_upload: boolean; // Whether to perform asynchronous upload
    no_tx_proxy: boolean; // Whether to skip transaction proxy
}

// Interface for tracking upload progress
export interface UploadProgress {
    loaded: number; // Number of bytes uploaded
    total: number; // Total number of bytes to upload
    percentage: number; // Upload progress percentage
    file: string; // Name of the file being uploaded
}

// Extended upload options with additional configuration
export interface UploadOptionsExtended extends UploadOptions {
    isBatchUpload?: boolean; // Force batch upload regardless of file size
    uploadFileWithProgress?: (progress: UploadProgress) => void; // Progress callback
    uploadFileWithRetry?: number; // Number of retries, default 3
    chunkSize?: number; // Chunk size for batch upload
    maxConcurrent?: number; // Max concurrent uploads for batch
    retryDelay?: number; // Delay between retries in ms
    onRetry?: (chunkIndex: number, attempt: number) => void; // Retry callback
}

/**
 * Unified upload method that handles both simple and batch uploads
 * Automatically switches to batch upload for files > 100MB or when isBatchUpload is true
 * 
 * @param config - Gateway configuration including base URL and authentication token
 * @param fileInput - The file to upload (string path, Buffer, or ReadStream)
 * @param options - Upload options with extended functionality
 * @returns Promise containing the upload response with success status and data
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
        const fileSize = await getFileSize(fileInput);

        const actualFilename = await determineFilename(fileInput, baseOptions.filename);

        const updatedOptions = {
            ...baseOptions,
            filename: actualFilename
        };

        const shouldUseBatchUpload = isBatchUpload || fileSize > DEFAULT_FILE_SIZE_THRESHOLD;

        if (shouldUseBatchUpload) {
            return await uploadLargeFileWithRetry(
                config,
                fileInput,
                updatedOptions.territory,
                updatedOptions.filename,
                {
                    chunkSize,
                    maxConcurrent,
                    maxRetries: uploadFileWithRetry,
                    retryDelay,
                    encrypt: updatedOptions.encrypt,
                    asyncUpload: updatedOptions.async,
                    noTxProxy: updatedOptions.noProxy,
                    onProgress: uploadFileWithProgress ? (progress) => {
                        uploadFileWithProgress({
                            loaded: progress.uploaded,
                            total: progress.total,
                            percentage: progress.percentage,
                            file: actualFilename // 使用正确的文件名
                        });
                    } : undefined,
                    onRetry
                }
            );
        } else {
            return await uploadFileWithRetryMechanism(
                config,
                fileInput,
                updatedOptions,
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
 * 
 * @param fileInput - The file input to get size for (string path, Buffer, or ReadStream)
 * @returns Promise containing the file size in bytes
 * @throws Error when file size cannot be determined (for ReadStream inputs)
 */
async function getFileSize(fileInput: FileInput): Promise<number> {
    if (Buffer.isBuffer(fileInput)) {
        return fileInput.length;
    }

    if (typeof fileInput === 'string') {
        try {
            const stats = await stat(fileInput);
            return stats.size;
        } catch (error) {
            throw new Error(`Failed to get file size: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    // For ReadStream, we'll need to read it to get size
    throw new Error("Cannot determine file size for ReadStream. Please use file path or Buffer input.");
}

/**
 * Simple upload with retry mechanism and progress
 * 
 * @param config - Gateway configuration including base URL and authentication token
 * @param fileInput - The file to upload (string path, Buffer, or ReadStream)
 * @param options - Upload options
 * @param maxRetries - Maximum number of retry attempts
 * @param retryDelay - Delay between retries in milliseconds
 * @param onProgress - Optional callback for upload progress tracking
 * @param onRetry - Optional callback when a retry is initiated
 * @returns Promise containing the upload response
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
            if (result.code === 200) {
                return result;
            }
            lastError = new Error(result.error || "Upload failed");
        } catch (error) {
            lastError = error instanceof Error ? error : new Error("Unknown error");
        }

        if (attempt < maxRetries) {
            onRetry?.(-1, attempt + 1);
            await sleep(retryDelay * (attempt + 1));
        }
    }

    return {
        success: false,
        error: `Upload failed after ${maxRetries + 1} attempts: ${lastError?.message || "Unknown error"}`,
    };
}
/**
 * Simple file upload with progress support
 * 
 * @param config - Gateway configuration including base URL and authentication token
 * @param fileInput - The file to upload (string path, Buffer, or ReadStream)
 * @param options - Upload options
 * @param onProgress - Optional callback for upload progress tracking
 * @returns Promise containing the upload response
 * @throws Error when upload fails
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
        const fileSize = await getFileSize(fileInput);
        const filename = options.filename || 'unknown';

        // Initial progress report
        onProgress?.({ loaded: 0, total: fileSize, percentage: 0, file: filename });

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        try {
            const response = await fetch(`${baseUrl}${GATEWAY_UPLOAD_FILE_URL}`, {
                method: "POST",
                headers: createHeaders(config.token),
                body: formData,
                signal: controller.signal,
            });

            // Handle HTTP errors
            if (!response.ok) {
                const errorText = await response.text().catch(() => 'Unknown error');
                throw new Error(
                    `HTTP ${response.status}: ${response.statusText}. ${errorText}`
                );
            }

            // Success progress report
            onProgress?.({ loaded: fileSize, total: fileSize, percentage: 100, file: filename });

            return await parseResponse(response);
        } finally {
            clearTimeout(timeoutId);
        }
    } catch (error) {
        throw new Error(`Failed to upload file: ${error instanceof Error ? error.message : String(error)}`);
    }
}

/**
 * Request batch upload session - matches Go implementation
 * 
 * @param config - Gateway configuration including base URL and authentication token
 * @param territory - Storage territory for the file
 * @param filename - Name of the file to upload
 * @param fileSize - Size of the file in bytes
 * @param encrypt - Whether to encrypt the file (default: false)
 * @param asyncUpload - Whether to perform asynchronous upload (default: true)
 * @param noTxProxy - Whether to skip transaction proxy (default: false)
 * @returns Promise containing the upload response with session information
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
            const errorText = await response.text().catch(() => 'Unknown error');
            throw new Error(`HTTP ${response.status}: ${response.statusText}. ${errorText}`);
        }

        return await parseResponse(response);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
        return { error: `Request batch upload error: ${errorMessage}` };
    }
}

/**
 * Upload a single chunk - optimized for Node.js Buffer operations
 * 
 * @param config - Gateway configuration including base URL and authentication token
 * @param hash - Upload session hash identifier
 * @param fileBuffer - Buffer containing the file data
 * @param start - Start byte index for the chunk
 * @param end - End byte index for the chunk
 * @returns Promise containing the upload response for the chunk
 */
async function batchUploadFile(
    config: GatewayConfig,
    hash: string,
    fileBuffer: Buffer,
    start: number,
    end: number
): Promise<UploadResponse> {
    const baseUrl = config.baseUrl.replace(/\/$/, "");

    if (start >= end || end <= 0 || start < 0) {
        return { error: "Bad content bytes range" };
    }

    try {
        const chunk = fileBuffer.subarray(start, end);
        if (chunk.length !== (end - start)) {
            return { error: "Invalid data length" };
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
            const errorText = await response.text().catch(() => 'Unknown error');
            throw new Error(`HTTP ${response.status}: ${response.statusText}. ${errorText}`);
        }

        return parseResponse(response);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
        return { error: `Batch upload file error: ${errorMessage}` };
    }
}

/**
 * Upload large file in chunks with parallel processing and progress tracking
 * 
 * @param config - Gateway configuration including base URL and authentication token
 * @param file - The file to upload (string path, Buffer, or ReadStream)
 * @param territory - Storage territory for the file
 * @param filename - Optional filename for the upload
 * @param options - Optional parameters for chunk size, concurrency, encryption, etc.
 * @returns Promise containing the upload response
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
        const { fileBuffer, actualFilename } = await prepareFileBuffer(file, filename);
        const fileSize = fileBuffer.length;
        let fid = "";

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

        // Step 2: Generate chunk info
        const chunks = Array.from({ length: totalChunks }, (_, i) => {
            const start = i * chunkSize;
            const end = Math.min(start + chunkSize, fileSize);
            return { start, end, index: i };
        });

        // Step 3: Upload chunks with parallel processing
        const uploadChunk = async (chunk: { start: number; end: number; index: number }) => {
            const result = await batchUploadFile(config, hash, fileBuffer, chunk.start, chunk.end);
            if (result.error) {
                throw new Error(`Chunk ${chunk.index} upload failed: ${result.error}`);
            }

            uploadedBytes += (chunk.end - chunk.start);
            onProgress?.({
                uploaded: uploadedBytes,
                total: fileSize,
                percentage: Math.round((uploadedBytes / fileSize) * 100),
            });

            if (result.data?.fid) {
                fid = result.data.fid;
            }

            return result;
        };

        const results = [];
        for (let i = 0; i < chunks.length; i += maxConcurrent) {
            const batch = chunks.slice(i, i + maxConcurrent);
            const batchPromises = batch.map(uploadChunk);
            const batchResults = await Promise.allSettled(batchPromises);

            const failures = batchResults.filter((result): result is PromiseRejectedResult =>
                result.status === 'rejected'
            );

            if (failures.length > 0) {
                throw new Error(`Batch upload failed: ${failures[0].reason}`);
            }

            results.push(...batchResults.map(result =>
                (result as PromiseFulfilledResult<any>).value
            ));
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
 * Prepare file buffer from different input types
 * 
 * @param file - The file to prepare (string path, Buffer, or ReadStream)
 * @param filename - Optional filename for the upload
 * @returns Promise containing the file buffer and actual filename
 * @throws Error when file input type is unsupported
 */
async function prepareFileBuffer(
    file: FileInput,
    filename?: string
): Promise<{ fileBuffer: Buffer; actualFilename: string }> {
    if (Buffer.isBuffer(file)) {
        return {
            fileBuffer: file,
            actualFilename: filename || generateDefaultFilename()
        };
    }

    if (typeof file === 'string') {
        const buffer = await readFile(file);
        return {
            fileBuffer: buffer,
            actualFilename: filename || extractFilenameFromPath(file)
        };
    }

    throw new Error("Unsupported file input type for batch upload");
}

/**
 * Upload large file with retry mechanism
 * 
 * @param config - Gateway configuration including base URL and authentication token
 * @param file - The file to upload (string path, Buffer, or ReadStream)
 * @param territory - Storage territory for the file
 * @param filename - Optional filename for the upload
 * @param options - Optional parameters for retry, chunk size, concurrency, etc.
 * @returns Promise containing the upload response
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
    const { maxRetries = 3, retryDelay = 1000, onRetry, ...uploadOptions } = options;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            const result = await uploadLargeFile(config, file, territory, filename, uploadOptions);
            if (result.code === 200) {
                return result;
            }
            lastError = new Error(result.error || "Upload failed");
        } catch (error) {
            lastError = error instanceof Error ? error : new Error("Unknown error");
        }

        if (attempt < maxRetries) {
            onRetry?.(-1, attempt + 1);
            await sleep(retryDelay * (attempt + 1));
        }
    }

    return {
        success: false,
        error: `Upload failed after ${maxRetries + 1} attempts: ${lastError?.message || "Unknown error"}`,
    };
}

/**
 * Create FormData for file upload with appropriate metadata
 * 
 * @param fileInput - The file to upload (string path, Buffer, or ReadStream)
 * @param options - Upload options including territory, encryption, etc.
 * @returns Promise containing the FormData object
 */
async function createFormData(fileInput: FileInput, options: UploadOptions): Promise<FormData> {
    const formData = new FormData();

    // Add file to FormData
    const { file, fileName } = await processFileInput(fileInput, options.filename);
    formData.append("file", file, fileName);

    // Add territory (required parameter)
    formData.append("territory", options.territory);

    // Add optional boolean parameters only if true
    if (options.async) formData.append("async", "true");
    if (options.noProxy) formData.append("noProxy", "true");
    if (options.encrypt) formData.append("encrypt", "true");

    // Add filename if explicitly provided
    if (options.filename) {
        formData.append("filename", options.filename);
    }

    return formData;
}

/**
 * Process file input to convert to Blob format and determine filename
 * 
 * @param fileInput - The file to process (string path, Buffer, or ReadStream)
 * @param explicitFilename - Optional explicit filename to use
 * @returns Promise containing the Blob and filename
 * @throws Error when file input type is unsupported
 */
async function processFileInput(
    fileInput: FileInput,
    explicitFilename?: string
): Promise<{ file: Blob; fileName: string }> {
    if (typeof fileInput === 'string') {
        const fileBuffer = await readFileFromPath(fileInput);
        const fileName = explicitFilename || extractFilenameFromPath(fileInput);
        return {
            file: new Blob([fileBuffer]),
            fileName
        };
    }

    if (Buffer.isBuffer(fileInput)) {
        const fileName = explicitFilename || generateDefaultFilename();
        return {
            file: new Blob([fileInput]),
            fileName
        };
    }

    throw new Error("Unsupported file input type: INVALID_FILE_INPUT");
}

/**
 * Read file from path and return as Buffer
 * 
 * @param filePath - Path to the file to read
 * @returns Promise containing the file as a Buffer
 * @throws Error when file read fails
 */
async function readFileFromPath(filePath: string): Promise<Buffer> {
    try {
        return await readFile(filePath);
    } catch (error) {
        throw new Error(
            `Failed to read file from path: ${filePath}: ${error instanceof Error ? error.message : String(error)}`
        );
    }
}

/**
 * Extract filename from file path
 * 
 * @param filePath - Path to extract filename from
 * @returns The filename portion of the path
 */
function extractFilenameFromPath(filePath: string): string {
    return basename(filePath);
}

/**
 * Generate default filename with timestamp
 * 
 * @returns A filename with timestamp in the format upload_{timestamp}.bin
 */
function generateDefaultFilename(): string {
    return `upload_${Date.now()}.bin`;
}

/**
 * Create HTTP headers (following Go version pattern)
 * 
 * @param token - Authentication token for the request
 * @returns Record containing the authorization header
 * @throws Error when token is not provided
 */
function createHeaders(token: string | undefined): Record<string, string> {
    if (!token) {
        throw new Error("Token is required");
    }

    return {
        "Token": `Bearer ${token}`,
    };
}

/**
 * Parse response with proper error handling
 * 
 * @param response - The fetch response object
 * @returns Promise containing the parsed response
 * @throws Error when response parsing fails
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
        throw new Error(`Failed to parse response: ${error instanceof Error ? error.message : String(error)}`);
    }
}

/**
 * Determine filename from file input or explicit filename
 * 
 * @param fileInput - The file input to extract name from (string path, Buffer, or ReadStream)
 * @param explicitFilename - Optional explicit filename to use
 * @returns The determined filename
 */
async function determineFilename(fileInput: FileInput, explicitFilename?: string): Promise<string> {
    if (explicitFilename) {
        return explicitFilename;
    }

    if (typeof fileInput === 'string') {
        return extractFilenameFromPath(fileInput);
    }

    if (Buffer.isBuffer(fileInput)) {
        return generateDefaultFilename();
    }

    // ReadStream case
    return generateDefaultFilename();
}