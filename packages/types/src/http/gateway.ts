import { signData } from "@/http/common";

export interface GenTokenReq extends signData{
    expire?: number // token expire after n hour
}

export interface UploadOptions {
    territory: string;
    filename?: string;
    // enable async upload
    async?: boolean;
    // create storage order by user instead of gateway
    noProxy?: boolean;
    // encrypt file by gateway
    encrypt?: boolean;
}

// token is required for upload request
export interface GatewayConfig {
    baseUrl: string;
    // generate token by your private key
    token?: string;
    timeout?: number;
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