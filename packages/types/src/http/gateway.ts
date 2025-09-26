import { signData } from "@/http/common";

export interface GenTokenReq extends signData{
    expire?: number // token expire after n hour
}

export interface UploadOptions {
    token: string;
    territory: string;
    filename?: string;
    async?: boolean;
    noProxy?: boolean;
    encrypt?: boolean;
    timeout?: number;
}
export interface GatewayConfig {
    baseUrl: string;
    token: string;
}

export interface BatchUploadOptions {
    start: number;
    end: number;
}

export interface UploadResponse {
    success?: boolean;
    status?: number;
    code?: number;
    msg?: string;
    error?: string;
    data?: any;
}

export interface DownloadOptions {
    fragment?: string;
    segmentHash?: string;
    fid: string;
}

export interface QueryDataOptions {
    hash?: string;
}

export interface FetchDataOptions {
    cacheKey: string;
}