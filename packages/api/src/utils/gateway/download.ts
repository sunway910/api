import { DownloadOptions, FetchDataOptions, GatewayConfig, QueryDataOptions, UploadResponse } from "@cessnetwork/types";
import fs from "fs";
import path from "path";
import { Readable } from "stream";
import { pipeline } from "stream/promises";
import { verifyUploadConfig } from "@/utils";

// Extended download options with additional configuration
export interface ExtendedDownloadOptions extends DownloadOptions {
    savePath?: string; // Optional path to save the file
    createDirectories?: boolean; // Whether to create directories if they don't exist
    overwrite?: boolean; // Whether to overwrite existing files
    range?: {
        start: number; // Start byte for range request
        end?: number;   // End byte for range request (optional)
    };
    encryption?: {
        capsule: string; // Encryption capsule
        rkb: string;     // Re-encryption key bytes
        pkx: string;     // Public key X
    };
}

// Interface for download result with extended data
export interface DownloadResult extends UploadResponse {
    data?: {
        content?: ArrayBuffer;        // The downloaded content as array buffer
        contentType?: string | null;  // Content type of the downloaded file
        contentLength?: string | null; // Length of the downloaded content
        contentRange?: string | null;  // Range information for partial downloads
        filePath?: string;            // Path where file was saved (if saved to disk)
        fileName?: string;            // Name of the saved file
        fileSize?: number;            // Size of the downloaded file in bytes
        isPartialContent?: boolean;   // Whether this is a partial download (status 206)
    };
}

// Gateway and Retriever API endpoints
export const GATEWAY_GETFILE_URL = "/gateway/download";
export const RETRIEVER_QUERYDATA_URL = "/querydata";
export const RETRIEVER_FETCHDATA_URL = "/cache-fetch";

/**
 * Download file from gateway with optional save to disk
 * 
 * @param config - Gateway configuration including base URL and authentication token
 * @param options - Extended download options including FID, segment hash, save path, etc.
 * @param onProgress - Optional callback for download progress tracking
 * @returns Promise containing the download result with success status and data
 */
export async function downloadFile(
    config: GatewayConfig,
    options: ExtendedDownloadOptions,
    onProgress?: (downloaded: number, total: number) => void
): Promise<DownloadResult> {
    const baseUrl = config.baseUrl.replace(/\/$/, "");

    try {
        let url: string;
        if (options.segmentHash) {
            url = `${baseUrl}${GATEWAY_GETFILE_URL}/${options.fid}/${options.segmentHash}`;
        } else {
            url = `${baseUrl}${GATEWAY_GETFILE_URL}/${options.fid}`;
        }

        const headers: Record<string, string> = {};

        if (options.range) {
            const {start, end} = options.range;
            headers["Range"] = `bytes=${start}-${end || ''}`;
        }

        if (options.encryption) {
            headers["Capsule"] = options.encryption.capsule;
            headers["Rkb"] = options.encryption.rkb;
            headers["Pkx"] = options.encryption.pkx;
        }

        const response = await fetch(url, {
            method: "GET",
            headers,
        });

        // Check if request was successful
        if (!response.ok) {
            return {
                success: false,
                status: response.status,
                error: `HTTP ${response.status}: ${response.statusText}`,
            };
        }

        const contentType = response.headers.get("content-type");
        const contentLength = response.headers.get("content-length");
        const contentRange = response.headers.get("content-range");
        const totalSize = contentLength ? parseInt(contentLength, 10) : 0;
        const isPartialContent = response.status === 206;

        // Extract filename from Content-Disposition header if available
        const contentDisposition = response.headers.get("content-disposition");
        let serverFileName: string | undefined;
        if (contentDisposition) {
            const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
            if (filenameMatch) {
                serverFileName = filenameMatch[1].replace(/['"]/g, '');
            }
        }

        // Determine whether to use progress tracking
        const useProgressTracking = !!onProgress;

        if (options.savePath) {
            // Save to file
            if (useProgressTracking) {
                // Save with progress tracking
                return await saveToFileWithProgress(
                    response,
                    options,
                    serverFileName,
                    totalSize,
                    onProgress,
                    {contentType, contentLength, contentRange, isPartialContent}
                );
            } else {
                // Save without progress tracking
                const saveResult = await saveResponseToFile(response, options, serverFileName);
                return {
                    success: true,
                    data: {
                        contentType,
                        contentLength,
                        contentRange,
                        isPartialContent,
                        filePath: saveResult.filePath,
                        fileName: saveResult.fileName,
                        fileSize: saveResult.fileSize,
                    },
                };
            }
        } else {
            if (useProgressTracking) {
                // Read with progress tracking
                return await readToBufferWithProgress(
                    response,
                    totalSize,
                    onProgress,
                    {contentType, contentLength, contentRange, isPartialContent}
                );
            } else {
                const data = await response.arrayBuffer();
                return {
                    success: true,
                    data: {
                        content: data,
                        contentType,
                        contentLength,
                        contentRange,
                        isPartialContent,
                        fileSize: data.byteLength,
                    },
                };
            }
        }
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error occurred",
        };
    }
}

/**
 * Helper function for saving response to file with progress tracking
 * 
 * @param response - The fetch response object containing the file data
 * @param options - Extended download options
 * @param serverFileName - Optional filename from server's Content-Disposition header
 * @param totalSize - Total size of the download in bytes
 * @param onProgress - Callback for progress tracking
 * @param responseHeaders - Headers from the response (content-type, content-length, etc.)
 * @returns Promise containing the download result
 */
async function saveToFileWithProgress(
    response: Response,
    options: ExtendedDownloadOptions,
    serverFileName: string | undefined,
    totalSize: number,
    onProgress: (downloaded: number, total: number) => void,
    responseHeaders: {
        contentType: string | null;
        contentLength: string | null;
        contentRange: string | null;
        isPartialContent: boolean;
    }
): Promise<DownloadResult> {
    const {filePath, fileName} = await prepareSavePath(
        options.savePath!,
        options.fid,
        responseHeaders.contentType,
        options.createDirectories,
        options.overwrite,
        serverFileName
    );

    const readable = Readable.fromWeb(response.body as ReadableStream<Uint8Array>);
    const writeStream = fs.createWriteStream(filePath);

    let downloadedSize = 0;

    // Track progress
    readable.on('data', (chunk: Buffer) => {
        downloadedSize += chunk.length;
        if (totalSize > 0) {
            onProgress(downloadedSize, totalSize);
        }
    });

    await pipeline(readable, writeStream);

    const stats = await fs.promises.stat(filePath);

    return {
        success: true,
        data: {
            contentType: responseHeaders.contentType,
            contentLength: responseHeaders.contentLength,
            contentRange: responseHeaders.contentRange,
            isPartialContent: responseHeaders.isPartialContent,
            filePath,
            fileName,
            fileSize: stats.size,
        },
    };
}

/**
 * Helper function for reading response to buffer with progress tracking
 * 
 * @param response - The fetch response object containing the file data
 * @param totalSize - Total size of the download in bytes
 * @param onProgress - Callback for progress tracking
 * @param responseHeaders - Headers from the response (content-type, content-length, etc.)
 * @returns Promise containing the download result with the content as ArrayBuffer
 */
async function readToBufferWithProgress(
    response: Response,
    totalSize: number,
    onProgress: (downloaded: number, total: number) => void,
    responseHeaders: {
        contentType: string | null;
        contentLength: string | null;
        contentRange: string | null;
        isPartialContent: boolean;
    }
): Promise<DownloadResult> {
    const chunks: Uint8Array[] = [];
    const reader = response.body?.getReader();

    if (!reader) {
        throw new Error("Response body is not readable");
    }

    let downloadedSize = 0;

    while (true) {
        const {done, value} = await reader.read();
        if (done) break;

        chunks.push(value);
        downloadedSize += value.length;

        if (totalSize > 0) {
            onProgress(downloadedSize, totalSize);
        }
    }

    const buffer = new Uint8Array(downloadedSize);
    let offset = 0;
    for (const chunk of chunks) {
        buffer.set(chunk, offset);
        offset += chunk.length;
    }

    return {
        success: true,
        data: {
            content: buffer.buffer,
            contentType: responseHeaders.contentType,
            contentLength: responseHeaders.contentLength,
            contentRange: responseHeaders.contentRange,
            isPartialContent: responseHeaders.isPartialContent,
            fileSize: downloadedSize,
        },
    };
}

/**
 * Save response stream to file
 * 
 * @param response - The fetch response object containing the file data
 * @param options - Extended download options including save path
 * @param serverFileName - Optional filename from server's Content-Disposition header
 * @returns Promise containing file path, name and size information
 */
async function saveResponseToFile(
    response: Response,
    options: ExtendedDownloadOptions,
    serverFileName?: string
): Promise<{ filePath: string; fileName: string; fileSize: number }> {
    if (!options.savePath) {
        throw new Error("Save path is required");
    }

    const {filePath, fileName} = await prepareSavePath(
        options.savePath,
        options.fid,
        response.headers.get("content-type"),
        options.createDirectories,
        options.overwrite,
        serverFileName
    );

    // Create readable stream from response
    const readable = Readable.fromWeb(response.body as ReadableStream<Uint8Array>);
    const writeStream = fs.createWriteStream(filePath);

    // Use pipeline for efficient streaming
    await pipeline(readable, writeStream);

    // Get file size
    const stats = await fs.promises.stat(filePath);

    return {
        filePath,
        fileName,
        fileSize: stats.size,
    };
}

/**
 * Generate filename from FID and content type
 * 
 * @param fid - File identifier to use in the filename
 * @param contentType - MIME content type of the file
 * @param serverFileName - Optional filename provided by the server
 * @returns Generated filename with appropriate extension
 */
function generateFileName(fid: string, contentType: string | null, serverFileName?: string): string {
    // Use server-provided filename if available
    if (serverFileName) {
        return serverFileName;
    }

    const extension = getExtensionFromContentType(contentType);
    // Use first 8 characters of fid as filename
    const baseName = fid.substring(0, 8);
    return `${baseName}${extension}`;
}

/**
 * Get file extension from content type
 * 
 * @param contentType - MIME content type string
 * @returns File extension corresponding to the content type
 */
function getExtensionFromContentType(contentType: string | null): string {
    if (!contentType) return '.bin';

    const mimeToExt: Record<string, string> = {
        'image/jpeg': '.jpg',
        'image/png': '.png',
        'image/gif': '.gif',
        'image/webp': '.webp',
        'image/svg+xml': '.svg',
        'text/plain': '.txt',
        'text/html': '.html',
        'text/css': '.css',
        'text/javascript': '.js',
        'application/pdf': '.pdf',
        'application/json': '.json',
        'application/xml': '.xml',
        'video/mp4': '.mp4',
        'video/webm': '.webm',
        'video/avi': '.avi',
        'video/quicktime': '.mov',
        'audio/mpeg': '.mp3',
        'audio/wav': '.wav',
        'audio/ogg': '.ogg',
        'application/zip': '.zip',
        'application/x-rar-compressed': '.rar',
        'application/x-7z-compressed': '.7z',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation': '.pptx',
        'application/octet-stream': '.bin',
    };

    return mimeToExt[contentType.toLowerCase()] || '.bin';
}

/**
 * Check if file exists
 * 
 * @param filePath - Path to check for file existence
 * @returns Promise resolving to true if file exists, false otherwise
 */
async function fileExists(filePath: string): Promise<boolean> {
    try {
        await fs.promises.access(filePath);
        return true;
    } catch {
        return false;
    }
}

/**
 * Prepare save path for downloaded file
 * 
 * @param savePath - The path where the file should be saved
 * @param fid - File identifier to use in filename if needed
 * @param contentType - Content type to determine file extension
 * @param createDirectories - Whether to create directories if they don't exist
 * @param overwrite - Whether to overwrite existing files
 * @param serverFileName - Optional filename provided by the server
 * @returns Promise containing the prepared file path and filename
 * @throws Error if file already exists and overwrite is false
 */
async function prepareSavePath(
    savePath: string,
    fid: string,
    contentType: string | null,
    createDirectories: boolean | undefined,
    overwrite: boolean | undefined,
    serverFileName?: string
): Promise<{ filePath: string, fileName: string }> {
    let filePath = savePath;
    let fileName: string;

    const isDirectory = filePath.endsWith('/') || filePath.endsWith('\\') ||
        (!path.extname(filePath) && !filePath.includes('.'));

    if (isDirectory) {
        fileName = generateFileName(fid, contentType, serverFileName);
        filePath = path.join(filePath, fileName);
    } else {
        fileName = path.basename(filePath);
    }

    if (createDirectories !== false) {
        const directory = path.dirname(filePath);
        await fs.promises.mkdir(directory, {recursive: true});
    }

    if (!overwrite && await fileExists(filePath)) {
        throw new Error(`File already exists: ${filePath}. Set overwrite: true to replace it.`);
    }

    return {filePath, fileName};
}

/**
 * Fetch file metadata without downloading content
 * Uses HTTP HEAD request to get file information
 * 
 * @param config - Gateway configuration including base URL and authentication token
 * @param options - Download options including FID
 * @returns Promise containing the metadata response with success status and data
 */
export async function getFileMetadata(
    config: GatewayConfig,
    options: DownloadOptions,
): Promise<UploadResponse> {
    const baseUrl = config.baseUrl.replace(/\/$/, "");
    try {
        // Build URL path according to Gin routing
        let url: string;
        if (options.segmentHash) {
            url = `${baseUrl}${GATEWAY_GETFILE_URL}/${options.fid}/${options.segmentHash}`;
        } else {
            url = `${baseUrl}${GATEWAY_GETFILE_URL}/${options.fid}`;
        }

        const headers: Record<string, string> = {};

        const response = await fetch(url, {
            method: "HEAD",
            headers,
        });

        if (!response.ok) {
            return {
                success: false,
                status: response.status,
                error: `HTTP ${response.status}: ${response.statusText}`,
            };
        }

        return {
            success: true,
            data: {
                contentType: response.headers.get("content-type"),
                contentLength: response.headers.get("content-length"),
                lastModified: response.headers.get("last-modified"),
                etag: response.headers.get("etag"),
                contentDisposition: response.headers.get("content-disposition"),
            },
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error occurred",
        };
    }
}

// Keep your existing functions for queryData, fetchCacheData, downloadFiles, etc.
// They don't need changes since they don't interact with the download endpoint

/**
 * Query data from retriever
 * 
 * @param config - Gateway configuration including base URL and authentication token
 * @param options - Query options with hash parameter
 * @returns Promise containing the query result with success status and data
 */
export async function queryData(
    config: GatewayConfig,
    options: QueryDataOptions = {},
): Promise<UploadResponse> {
    const baseUrl = config.baseUrl.replace(/\/$/, "");
    try {
        const params = new URLSearchParams();

        if (options.hash) {
            params.append("hash", options.hash);
        }

        const url = `${baseUrl}${RETRIEVER_QUERYDATA_URL}?${params.toString()}`;

        const response = await fetch(url, {
            method: "GET",
            headers: {
                "Token": config.token!,
            },
        });
        const result = await response.json();
        return {
            success: true,
            data: result,
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error occurred",
        };
    }
}

/**
 * Fetch data from cache
 * 
 * @param config - Gateway configuration including base URL and authentication token
 * @param options - Fetch options with cache key
 * @returns Promise containing the cached data with success status and data
 */
export async function fetchCacheData(
    config: GatewayConfig,
    options: FetchDataOptions,
): Promise<UploadResponse> {
    const baseUrl = config.baseUrl.replace(/\/$/, "");
    try {
        verifyUploadConfig(config);
        const params = new URLSearchParams();
        params.append("cacheKey", options.cacheKey);

        const url = `${baseUrl}${RETRIEVER_FETCHDATA_URL}?${params.toString()}`;

        const response = await fetch(url, {
            method: "GET",
            headers: {
                "Token": config.token!,
            },
        });

        const result = await response.json();
        return {
            success: true,
            data: result,
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error occurred",
        };
    }
}