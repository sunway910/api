import { SpaceProofInfo } from "./audit";
import { H512 } from "@polkadot/types/interfaces";

/**
 * TEE signature which can be in multiple formats
 */
export type TeeSig = Uint8Array | number[] | string | H512;

/**
 * Detailed information about a restoral target
 */
export interface RestoralTargetInfoDetail {
    /** Account ID as SS58 address */
    accountId: string;
    /** Restoral target information */
    restoralTargetInfo: RestoralTargetInfo;
}

/**
 * Information about a restoral target
 */
export interface RestoralTargetInfo {
    /** Miner's account ID as SS58 address */
    miner: string;
    /** Amount of service space */
    serviceSpace: bigint;
    /** Amount of restored space */
    restoredSpace: bigint;
    /** Cooling block number */
    coolingBlock: number;
}

/**
 * Pending replacement information
 */
export interface PendingReplacement {
    /** Account ID as SS58 address (optional) */
    account?: string;
    /** Replacement value */
    value: number;
}

/**
 * Information about an expander
 */
export interface ExpanderInfo {
    /** K parameter */
    k: number;
    /** N parameter */
    n: number;
    /** D parameter */
    d: number;
}

/**
 * Detailed information about a miner
 */
export interface MinerInfo {
    /** Beneficiary account ID as SS58 address */
    beneficiary: string;
    /** Staking account ID as SS58 address */
    stakingAccount: string;
    /** Endpoint as hex string */
    endpoint: string;
    /** Collateral amount */
    collaterals: bigint;
    /** Debt amount */
    debt: bigint;
    /** Current state of the miner */
    state: string;
    /** Declared space amount */
    declarationSpace: bigint;
    /** Idle space amount */
    idleSpace: bigint;
    /** Service space amount */
    serviceSpace: bigint;
    /** Locked space amount */
    lockSpace: bigint;
    /** Space proof information (nullable) */
    spaceProofInfo: SpaceProofInfo | null;
    /** Service bloom filter with fixed length */
    serviceBloomFilter: number[] & { length: 256 };
    /** TEE signature as hex string */
    teeSignature: string;
}

/**
 * Detailed miner information with account
 */
export interface MinerInfoDetail {
    /** Account ID as SS58 address */
    account: string;
    /** Miner information */
    minerInfo: MinerInfo;
}

/**
 * Information about when a miner started staking
 */
export interface MinerStakingStartBlock {
    /** Account ID as SS58 address */
    account: string;
    /** Block number */
    blockNumber: number;
}

/**
 * Miner reward information
 */
export interface MinerReward {
    /** Total reward amount */
    totalReward: bigint;
    /** Issued reward amount */
    rewardIssued: bigint;
    /** List of reward orders */
    orderList: RewardOrder[];
}

/**
 * Detailed miner reward information with account
 */
export interface MinerRewardDetail {
    /** Account ID as SS58 address */
    account: string;
    /** Miner reward information */
    minerReward: MinerReward;
}

/**
 * Information about the active staking era
 */
export interface StakingActiveEraInfo {
    /** Era index */
    index: number;
    /** Start time */
    start: number;
}

/**
 * Information about a reward order
 */
export interface RewardOrder {
    /** Number of times rewards have been received */
    receiveCount: number;
    /** Maximum number of times rewards can be received */
    maxCount: number;
    /** Whether rewards can be received at once */
    atonce: boolean;
    /** Order reward amount */
    orderReward: bigint;
    /** Amount per each reward */
    eachAmount: bigint;
    /** Last block number where rewards were received */
    lastReceiveBlock: number;
}

/**
 * Complete snapshot type information
 */
export interface CompleteSnapShotType {
    /** Number of miners */
    minerCount: number;
    /** Total power */
    totalPower: number;
}

/**
 * Complete information about a miner
 */
export interface MinerCompleteInfo {
    /** Era index */
    eraIndex: number;
    /** Whether rewards have been issued */
    issued: boolean;
    /** Finish block number */
    finishBlock: number;
    /** Power value */
    power: string;
}

/**
 * Detailed complete miner information with account
 */
export interface MinerCompleteDetail {
    /** Account ID as SS58 address */
    account: string;
    /** Complete miner information */
    minerCompleteInfo: MinerCompleteInfo;
}

/**
 * Possible states of a miner
 */
export enum MinerState {
    /** Positive state */
    MINER_STATE_POSITIVE = "positive",
    /** Frozen state */
    MINER_STATE_FROZEN = "frozen",
    /** Exit state */
    MINER_STATE_EXIT = "exit",
    /** Lock state */
    MINER_STATE_LOCK = "lock",
    /** Offline state */
    MINER_STATE_OFFLINE = "offline"
}