import { DownloadOptions, FetchDataOptions, GatewayConfig, QueryDataOptions, UploadResponse } from "@cessnetwork/types";
import fs from "fs";
import path from "path";
import { pipeline } from "stream/promises";
import { Readable } from "stream";

export interface ExtendedDownloadOptions extends DownloadOptions {
    savePath?: string; // Optional path to save the file
    createDirectories?: boolean; // Whether to create directories if they don't exist
    overwrite?: boolean; // Whether to overwrite existing files
    // Range request support
    range?: {
        start: number;
        end?: number;
    };
    // Encryption support (matching server's capsule/rkb/pkx headers)
    encryption?: {
        capsule: string;
        rkb: string;
        pkx: string;
    };
}

export interface DownloadResult extends UploadResponse {
    data?: {
        content?: ArrayBuffer;
        contentType?: string | null;
        contentLength?: string | null;
        contentRange?: string | null; // For range requests
        filePath?: string; // Path where file was saved
        fileName?: string; // Name of the saved file
        fileSize?: number; // Size of the downloaded file
        isPartialContent?: boolean; // Whether this is a partial download
    };
}

// Gateway and Retriever API endpoints
export const GATEWAY_GETFILE_URL = "/gateway/download";
export const RETRIEVER_QUERYDATA_URL = "/querydata";
export const RETRIEVER_FETCHDATA_URL = "/cache-fetch";

/**
 * Download file from gateway with optional save to disk
 */
export async function downloadFile(
    config: GatewayConfig,
    options: ExtendedDownloadOptions,
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

        // Add Range header for partial downloads
        if (options.range) {
            const {start, end} = options.range;
            headers["Range"] = `bytes=${start}-${end || ''}`;
        }

        // Add encryption headers if provided
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
            // Try to parse error response
            try {
                const errorData = await response.json();
                return {
                    success: false,
                    status: response.status,
                    error: `HTTP ${response.status}: ${response.statusText}`,
                };
            } catch {
                return {
                    success: false,
                    status: response.status,
                    error: `HTTP ${response.status}: ${response.statusText}`,
                };
            }
        }

        const contentType = response.headers.get("content-type");
        const contentLength = response.headers.get("content-length");
        const contentRange = response.headers.get("content-range");
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

        // If savePath is provided, save to disk
        if (options.savePath) {
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
        } else {
            // Return as ArrayBuffer for in-memory use
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
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error occurred",
        };
    }
}

/**
 * Save response stream to file
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
 * Generate filename from fid and content type
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
 */
async function fileExists(filePath: string): Promise<boolean> {
    try {
        await fs.promises.access(filePath);
        return true;
    } catch {
        return false;
    }
}

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
 * Download file with range request support (useful for resuming downloads)
 */
export async function downloadFileRange(
    config: GatewayConfig,
    options: ExtendedDownloadOptions,
    start: number,
    end?: number
): Promise<DownloadResult> {
    const rangeOptions: ExtendedDownloadOptions = {
        ...options,
        range: {start, end},
    };
    return downloadFile(config, rangeOptions);
}

/**
 * Download encrypted file
 */
export async function downloadEncryptedFile(
    config: GatewayConfig,
    options: ExtendedDownloadOptions,
    encryptionData: {
        capsule: string;
        rkb: string;
        pkx: string;
    }
): Promise<DownloadResult> {
    const encryptedOptions: ExtendedDownloadOptions = {
        ...options,
        encryption: encryptionData,
    };
    return downloadFile(config, encryptedOptions);
}

/**
 * Fetch file metadata without downloading content
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

/**
 * Download file with progress tracking and support for range requests
 */
export async function downloadFileWithProgress(
    config: GatewayConfig,
    options: ExtendedDownloadOptions,
    onProgress?: (downloaded: number, total: number) => void
): Promise<DownloadResult> {
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

        // Add Range header if specified
        if (options.range) {
            const {start, end} = options.range;
            headers["Range"] = `bytes=${start}-${end || ''}`;
        }

        // Add encryption headers if provided
        if (options.encryption) {
            headers["Capsule"] = options.encryption.capsule;
            headers["Rkb"] = options.encryption.rkb;
            headers["Pkx"] = options.encryption.pkx;
        }

        const response = await fetch(url, {
            method: "GET",
            headers,
        });

        if (!response.ok) {
            try {
                const errorData = await response.json();
                return {
                    success: false,
                    status: response.status,
                    error: `HTTP ${response.status}: ${response.statusText}`,
                };
            } catch {
                return {
                    success: false,
                    status: response.status,
                    error: `HTTP ${response.status}: ${response.statusText}`,
                };
            }
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

        let downloadedSize = 0;

        if (options.savePath) {
            // Save to file with progress tracking
            const {filePath, fileName} = await prepareSavePath(
                options.savePath,
                options.fid,
                contentType,
                options.createDirectories,
                options.overwrite,
                serverFileName
            );

            const readable = Readable.fromWeb(response.body as ReadableStream<Uint8Array>);
            const writeStream = fs.createWriteStream(filePath);

            // Track progress
            readable.on('data', (chunk: Buffer) => {
                downloadedSize += chunk.length;
                if (onProgress && totalSize > 0) {
                    onProgress(downloadedSize, totalSize);
                }
            });

            await pipeline(readable, writeStream);

            const stats = await fs.promises.stat(filePath);

            return {
                success: true,
                data: {
                    contentType,
                    contentLength,
                    contentRange,
                    isPartialContent,
                    filePath,
                    fileName,
                    fileSize: stats.size,
                },
            };
        } else {
            // Return as ArrayBuffer with progress tracking
            const chunks: Uint8Array[] = [];
            const reader = response.body?.getReader();

            if (!reader) {
                throw new Error("Response body is not readable");
            }

            while (true) {
                const {done, value} = await reader.read();
                if (done) break;

                chunks.push(value);
                downloadedSize += value.length;

                if (onProgress && totalSize > 0) {
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
                    contentType,
                    contentLength,
                    contentRange,
                    isPartialContent,
                    fileSize: downloadedSize,
                },
            };
        }
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
                "Token": config.token,
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
 */
export async function fetchCacheData(
    config: GatewayConfig,
    options: FetchDataOptions,
): Promise<UploadResponse> {
    const baseUrl = config.baseUrl.replace(/\/$/, "");
    try {
        const params = new URLSearchParams();
        params.append("cacheKey", options.cacheKey);

        const url = `${baseUrl}${RETRIEVER_FETCHDATA_URL}?${params.toString()}`;

        const response = await fetch(url, {
            method: "GET",
            headers: {
                "Token": config.token,
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

// Add batch download functions here if needed...