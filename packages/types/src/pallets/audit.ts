import { Bytes, u8, Vec } from "@polkadot/types";

/**
 * Space proof representation which can be in multiple formats
 */
export type SpaceProof = string | Uint8Array | Bytes;

/**
 * Bloom filter with fixed length of 256
 */
export type BloomFilter = (bigint[] & { length: 256 }) | BigInt64Array;

/**
 * Accumulator with fixed length of 256 bytes
 */
export type Accumulator = 
  | (Uint8Array & { length: 256 }) 
  | Vec<u8> 
  | (number[] & { length: 256 }) 
  | string;

/**
 * Information about a challenge for a miner
 */
export interface ChallengeInfo {
    /** Snapshot of the miner's state */
    minerSnapshot: MinerSnapShot;
    /** Details of the challenge element */
    challengeElement: ChallengeElement;
    /** Proof information */
    proveInfo: ProveInfo;
}

/**
 * Details of a challenge element
 */
export interface ChallengeElement {
    /** Start time of the challenge */
    start: number;
    /** Idle slip value */
    idleSlip: number;
    /** Service slip value */
    serviceSlip: number;
    /** Verification slip value */
    verifySlip: number;
    /** Space challenge parameters as hex string */
    spaceParam: number[];
    /** Service challenge parameters */
    serviceParam: QElement;
}

/**
 * Service challenge parameters
 */
export interface QElement {
    /** List of random indices */
    randomIndexList: number[];
    /** List of random values as hex strings */
    randomList: string[];
}

/**
 * Snapshot of a miner's state at a point in time
 */
export interface MinerSnapShot {
    /** Amount of idle space */
    idleSpace: bigint;
    /** Amount of service space */
    serviceSpace: bigint;
    /** Service bloom filter */
    serviceBloomFilter: number[];
    /** Space proof information */
    spaceProofInfo: SpaceProofInfo;
    /** TEE signature as hex string */
    teeSignature: string;
}

/**
 * PoIS (Proof of Insertion and Surjection) key information
 */
export interface PoISKeyInfo {
    /** PoIS key G parameter */
    g: string | Uint8Array | number[];
    /** PoIS key N parameter */
    n: string | Uint8Array | number[];
}

/**
 * Proof information for both idle and service proofs
 */
export interface ProveInfo {
    /** Assignment value */
    assign: number;
    /** Idle proof information */
    idleProve: IdleProveInfo | null;
    /** Service proof information */
    serviceProve: ServiceProveInfo | null;
}

/**
 * Information about an idle proof
 */
export interface IdleProveInfo {
    /** TEE public key as hex string */
    teePubkey: string;
    /** Idle proof as hex string */
    idleProve: string;
    /** Verification result */
    verifyResult: boolean | null;
}

/**
 * Information about a service proof
 */
export interface ServiceProveInfo {
    /** TEE public key as hex string */
    teePubkey: string;
    /** Service proof as hex string */
    serviceProve: string;
    /** Verification result */
    verifyResult: boolean | null;
}

/**
 * Space proof information for a miner
 */
export interface SpaceProofInfo {
    /** Miner's account ID as SS58 address */
    miner: string;
    /** Front value */
    front: number;
    /** Rear value */
    rear: number;
    /** PoIS key information */
    poisKey: PoISKeyInfo;
    /** Accumulator as hex string */
    accumulator: string;
}
