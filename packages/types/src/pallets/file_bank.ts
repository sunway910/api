/**
 * Information about a user's file slice
 */
export interface UserFileSliceInfo {
    /** Territory name as hex string */
    territoryName: string;
    /** File hash as hex string */
    fileHash: string;
    /** File size */
    fileSize: bigint;
}

/**
 * Detailed information about a user's file slice with account
 */
export interface UserFileSliceDetail {
    /** Account ID as SS58 address */
    account: string;
    /** List of user file slice information */
    userFileSliceInfo: UserFileSliceInfo[];
}

/**
 * Storage order information
 */
export interface StorageOrder {
    /** File size */
    fileSize: bigint;
    /** List of segments */
    segmentList: SegmentList[];
    /** User information */
    user: UserBrief;
    /** List of completion information */
    completeList: CompleteInfo[];
}

/**
 * Detailed storage order information with hash
 */
export interface StorageOrderDetail {
    /** Hash as hex string */
    hash: string;
    /** Storage order information */
    storageOrder: StorageOrder;
}

/**
 * Information about a segment list
 */
export interface SegmentList {
    /** Hash as hex string */
    hash: string;
    /** List of fragment hashes as hex strings */
    fragmentList: string[];
}

/**
 * Completion information
 */
export interface CompleteInfo {
    /** Index */
    index: number;
    /** Miner's account ID as SS58 address */
    miner: string;
}

/**
 * File metadata information
 */
export interface FileMetadata {
    /** List of segments */
    segmentList: SegmentInfo[];
    /** List of owners */
    owner: UserBrief[];
    /** File size */
    fileSize: bigint;
    /** Completion status */
    completion: number;
    /** State */
    state: number;
}

/**
 * Detailed file metadata information with file ID
 */
export interface FileMetadataDetail {
    /** File ID as hex string */
    fid: string;
    /** File metadata information */
    fileMetadata: FileMetadata;
}

/**
 * Information about a segment
 */
export interface SegmentInfo {
    /** Hash as hex string */
    hash: string;
    /** List of fragments */
    fragmentList: FragmentInfo[];
}

/**
 * Information about a fragment
 */
export interface FragmentInfo {
    /** Hash as hex string */
    hash: string;
    /** Availability status */
    avail: boolean;
    /** Tag */
    tag: number | null;
    /** Miner's account ID as SS58 address */
    miner: string;
}

/**
 * Brief user information
 */
export interface UserBrief {
    /** User's account ID as SS58 address */
    user: string;
    /** File name as hex string */
    fileName: string;
    /** Territory name as hex string */
    territoryName: string;
}

/**
 * Restoral order information
 */
export interface RestoralOrderInfo {
    /** Count */
    count: number;
    /** Miner's account ID as SS58 address */
    miner: string;
    /** Origin miner's account ID as SS58 address */
    originMiner: string;
    /** Fragment hash as hex string */
    fragmentHash: string;
    /** File hash as hex string */
    fileHash: string;
    /** Generation block number */
    genBlock: number;
    /** Deadline */
    deadline: number;
}

/**
 * Detailed restoral order information with fragment hash
 */
export interface RestoralOrderInfoDetail {
    /** Fragment hash as hex string */
    fragmentHash: string;
    /** Restoral order information */
    restoralOrderInfo: RestoralOrderInfo;
}

/**
 * Possible states of a file
 */
export enum FileState {
    /** Active state */
    Active = 0,
    /** Calculate state */
    Calculate,
    /** Missing state */
    Missing,
    /** Recovery state */
    Recovery
}
