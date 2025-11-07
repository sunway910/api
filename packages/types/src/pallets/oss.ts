/**
 * Information about OSS (Object Storage Service)
 */
export interface OssInfo {
    /** 
     * Domain URL which can be connected to the OSS
     * Note: peerId field is deprecated
     */
    peerId: string;
    domain: string;
}

/**
 * Detailed OSS information with account
 */
export interface OssDetail {
    /** Account ID as SS58 address */
    account: string;
    /** OSS information */
    ossInfo: OssInfo;
}

/**
 * OSS authority list
 */
export interface OssAuthorityList {
    /** OSS accounts as SS58 addresses */
    ossAcc: string[] | string;
    /** Authorized account as SS58 address */
    authorizedAcc: string;
}

/**
 * OSS proxy authentication payload
 */
export interface OssProxyAuthPayload {
    /** OSS account as SS58 address */
    oss: string;
    /** Expiration time */
    exp: number;
}

/**
 * EIP712 signature with fixed length of 65 bytes
 */
export interface EIP712Signature extends Uint8Array {
    readonly length: 65;
}

/**
 * Proxy signature which can be in multiple formats
 */
export type ProxySig = Uint8Array | EIP712Signature | string;
