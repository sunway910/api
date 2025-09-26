import { PoISKeyInfo } from "./audit";
import { HexString } from "@polkadot/util/types";
import { Bytes } from "@polkadot/types";

/**
 * TEE worker public key which can be in multiple formats
 */
export type TeeWorkerPublicKey = string | Uint8Array | HexString | Bytes;

/**
 * TEE master key status
 */
export interface TeeMasterKeyStatus {
    /** Launched information */
    launched: Launched;
}

/**
 * Launched information
 */
export interface Launched {
    /** Public key as hex string */
    pubkey: string;
    /** Holder as hex string */
    holder: string;
    /** TEE start time information */
    launchedAt: TEEStartTime;
}

/**
 * TEE start time information
 */
export interface TEEStartTime {
    /** Era number */
    era: number;
    /** Start time */
    startTime: number;
}

/**
 * TEE worker information
 */
export interface TeeWorker {
    /** Public key as hex string */
    pubkey: string;
    /** ECDH public key as hex string */
    ecdhPubkey: string;
    /** Version number */
    version: number;
    /** Last updated time */
    lastUpdated: number;
    /** Stash account ID as SS58 address or null */
    stashAccount: string | null;
    /** Attestation provider */
    attestationProvider: string | null;
    /** Confidence level */
    confidenceLevel: number;
    /** Features */
    features: number[];
    /** Role (0:Full 1:Verifier 2:Marker) */
    role: string;
    /** Endpoint as hex string */
    endpoint: string;
}

/**
 * Detailed TEE worker information with public key
 */
export interface TeeWorkerDetail {
    /** Public key as hex string */
    publicKey: string;
    /** TEE worker information */
    teeWorker: TeeWorker;
}

/**
 * Information about when a worker was added
 */
export interface WorkerAddedAt {
    /** Public key as hex string */
    publicKey: string;
    /** Block number */
    blockNumber: number;
}

/**
 * Endpoint information
 */
export interface Endpoints {
    /** Public key as hex string */
    publicKey: string;
    /** Endpoint */
    endpoint: string;
}

/**
 * Idle signature information
 */
export interface IdleSignInfo {
    /** Miner's account ID as SS58 address */
    miner: string;
    /** Rear value */
    rear: string;
    /** Front value */
    front: string;
    /** Accumulator as hex string */
    accumulator: string;
    /** Last operation block number */
    lastOperationBlock: number;
    /** PoIS key information */
    poisKey: PoISKeyInfo;
}

/**
 * Tag signature information
 */
export interface TagSigInfo {
    /** Miner's account ID as SS58 address */
    miner: string;
    /** Digest information */
    digest: DigestInfo[];
    /** File hash as hex string */
    filehash: string;
}

/**
 * Digest information
 */
export interface DigestInfo {
    /** Fragment as hex string */
    fragment: string;
    /** TEE public key as hex string */
    teePubkey: string;
}

/**
 * Types of TEE workers
 */
export enum TeeType {
    /** Full TEE worker */
    TeeType_Full = 0,
    /** Verifier TEE worker */
    TeeType_Verifier = 1,
    /** Marker TEE worker */
    TeeType_Marker = 2
}