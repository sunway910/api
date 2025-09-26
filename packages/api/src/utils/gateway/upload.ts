import { BatchUploadOptions, GatewayConfig, UploadOptions as BaseUploadOptions, UploadResponse } from "@cessnetwork/types";
import fs, { ReadStream } from "fs";
import path from "path";
import { Blob, File, FormData } from 'formdata-node';

export type UploadOptions = Omit<BaseUploadOptions, "token">;

type FileInput = string | Buffer | ReadStream;

// Gateway API endpoints
export const GATEWAY_UPLOADFILE_URL = "/gateway/upload/file";
export const GATEWAY_BATCHUPLOAD_URL = "/gateway/upload/batch/file";
export const GATEWAY_BATCHREQUEST_URL = "/gateway/upload/batch/request";

async function readFileToBuffer(fileInput: FileInput): Promise<Buffer> {
    if (typeof fileInput === 'string') {
        return fs.promises.readFile(fileInput);
    } else if (Buffer.isBuffer(fileInput)) {
        return fileInput;
    } else if (fileInput instanceof ReadStream) {
        const chunks: Uint8Array[] = [];
        for await (const chunk of fileInput) {
            chunks.push(chunk);
        }
        return Buffer.concat(chunks);
    } else {
        throw new Error("Invalid file input type. Expected string (path), Buffer, or ReadStream.");
    }
}

/**
 * Upload a single file to gateway
 */
export async function uploadFile(
    config: GatewayConfig,
    fileInput: FileInput,
    options: UploadOptions,
): Promise<UploadResponse> {
    const baseUrl = config.baseUrl.replace(/\/$/, "");
    try {
        const formData = new FormData();

        const fileBuffer = await readFileToBuffer(fileInput);
        let fileName: string;
        if (typeof fileInput === 'string') {
            fileName = path.basename(fileInput);
        } else {
            fileName = options.filename || "file.dat";
        }
        const file = new File([fileBuffer], fileName);
        formData.append("file", file, fileName);

        // Add optional parameters
        const params: Record<string, string | undefined> = {
            territory: options.territory,
            async: options.async ? "true" : undefined,
            noProxy: options.noProxy ? "true" : undefined,
            encrypt: options.encrypt ? "true" : undefined,
            filename: options.filename,
        };

        for (const [key, value] of Object.entries(params)) {
            if (value) {
                formData.append(key, value);
            }
        }

        const response = await fetch(`${baseUrl}${GATEWAY_UPLOADFILE_URL}`, {
            method: "POST",
            headers: {
                "Token": config.token,
            },
            body: formData,
        });
        return await response.json() as unknown as UploadResponse;
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error occurred",
        };
    }
}

/**
 * Upload file content as ArrayBuffer or Blob
 */
export async function uploadFileContent(
    config: GatewayConfig,
    content: ArrayBuffer | Buffer,
    filename: string,
    options: UploadOptions
): Promise<UploadResponse> {
    // Convert ArrayBuffer to Buffer if needed
    const bufferContent = ArrayBuffer.isView(content) || content instanceof ArrayBuffer
        ? Buffer.from(content as ArrayBuffer)
        : content as Buffer;

    return uploadFile(config, bufferContent, {...options, filename});
}

/**
 * Batch upload file chunks
 */
export async function batchUploadFile(
    config: GatewayConfig,
    hash: string,
    fileContent: Buffer,
    options: BatchUploadOptions
): Promise<UploadResponse> {
    const baseUrl = config.baseUrl.replace(/\/$/, "");
    try {
        const chunk = fileContent.subarray(options.start, options.end);
        const formData = new FormData();

        formData.append("hash", hash);
        formData.append("start", options.start.toString());
        formData.append("end", options.end.toString());
        formData.append("chunk", new Blob([chunk]), "chunk.dat");

        const response = await fetch(`${baseUrl}${GATEWAY_BATCHUPLOAD_URL}`, {
            method: "POST",
            headers: {
                "Token": `${config.token}`,
            },
            body: formData,
        });
        return await response.json() as unknown as UploadResponse;
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error occurred",
        };
    }
}

/**
 * Request batch upload session
 */
export async function batchUploadRequest(
    config: GatewayConfig,
    hash: string,
    fileSize: number,
): Promise<UploadResponse> {
    const baseUrl = config.baseUrl.replace(/\/$/, "");
    try {
        const response = await fetch(`${baseUrl}${GATEWAY_BATCHREQUEST_URL}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Token": `Bearer ${config.token}`,
            },
            body: JSON.stringify({
                hash,
                fileSize,
            }),
        });
        return await response.json() as unknown as UploadResponse;
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error occurred",
        };
    }
}

/**
 * Upload large file in chunks
 */
export async function uploadLargeFile(
    config: GatewayConfig,
    fileInput: FileInput,
    hash: string,
    chunkSize: number = 100 * 1024 * 1024 // 100M default chunk size
): Promise<UploadResponse> {
    try {
        const fileBuffer = await readFileToBuffer(fileInput);
        const fileSize = fileBuffer.length;

        const requestResult = await batchUploadRequest(config, hash, fileSize);
        if (!requestResult.success) {
            return requestResult;
        }

        const totalChunks = Math.ceil(fileSize / chunkSize);

        for (let i = 0; i < totalChunks; i++) {
            const start = i * chunkSize;
            const end = Math.min(start + chunkSize, fileSize);

            const chunkResult = await batchUploadFile(config, hash, fileBuffer, {start, end});
            if (!chunkResult.success) {
                return chunkResult;
            }
        }

        return {
            success: true,
            data: {message: "file uploaded successfully", totalChunks},
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error occurred",
        };
    }
}
