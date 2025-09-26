/**
 * Staking era reward points
 */
export interface StakingEraRewardPoint {
    /** Total reward points */
    total: bigint;
    /** Individual reward points */
    individual: Individual[];
}

/**
 * Detailed staking era reward points with era number
 */
export interface StakingEraRewardPointDetail {
    /** Era number */
    eraNumber: number;
    /** Staking era reward points */
    stakingEraRewardPoint: StakingEraRewardPoint;
}

/**
 * Individual reward information
 */
export interface Individual {
    /** Account ID as SS58 address */
    acc: string;
    /** Reward amount */
    reward: bigint;
}

/**
 * Stake information for an era
 */
export interface StakeOnEra {
    /** Era number */
    eraNumber: bigint;
    /** Stake amount */
    stake: string;
}

/**
 * Staking nomination information
 */
export interface StakingNomination {
    /** Target accounts as SS58 addresses */
    targets: string[];
    /** Era when nomination was submitted */
    submittedIn: number;
    /** Whether nomination is suppressed */
    suppressed: boolean;
}

/**
 * Detailed staking nomination information with account
 */
export interface StakingNominationDetail {
    /** Account ID as SS58 address */
    account: string;
    /** Staking nomination information */
    stakingNomination: StakingNomination;
}

/**
 * Staking ledger information
 */
export interface StakingLedger {
    /** Stash account ID as SS58 address */
    stash: string;
    /** Total amount */
    total: bigint;
    /** Active amount */
    active: bigint;
    /** Unlocking chunks */
    unlocking: UnlockChunk[];
    /** Legacy claimed rewards */
    legacyClaimedRewards: bigint[];
}

/**
 * Detailed staking ledger information with account
 */
export interface StakingLedgerDetail {
    /** Staking ledger information */
    stakingLedger: StakingLedger;
    /** Account ID as SS58 address */
    account: string;
}

/**
 * Unlock chunk information
 */
export interface UnlockChunk {
    /** Value amount */
    value: bigint;
    /** Era number */
    era: number;
}

/**
 * Staking bounded accounts information
 */
export interface StakingBounded {
    /** Controller account ID as SS58 address */
    controllerAcc: string;
    /** Stash account ID as SS58 address */
    stashAcc: string;
}

/**
 * Staking exposure information
 */
export interface StakingExposure {
    /** Total amount */
    total: bigint;
    /** Own amount */
    own: bigint;
    /** Other staking exposures */
    others: OtherStakingExposure[];
}

/**
 * Detailed staking exposure information with account
 */
export interface StakingExposureDetail {
    /** Account ID as SS58 address */
    account: string;
    /** Staking exposure information */
    stakingExposure: StakingExposure;
}

/**
 * Paged staking exposure information
 */
export interface StakingExposurePaged {
    /** Page total amount */
    pageTotal: bigint;
    /** Other staking exposures */
    others: OtherStakingExposure[];
}

/**
 * Detailed paged staking exposure information
 */
export interface StakingExposurePagedDetail {
    /** Era number */
    era: number;
    /** Account ID as SS58 address */
    account: string;
    /** Page index */
    pageIndex: bigint;
    /** Paged staking exposure information */
    stakingExposurePaged: StakingExposurePaged;
}

/**
 * Other staking exposure information
 */
export interface OtherStakingExposure {
    /** Account ID as SS58 address */
    who: string;
    /** Value amount */
    value: bigint;
}

/**
 * Paged exposure metadata
 */
export interface PagedExposureMetadata {
    /** Total amount */
    total: bigint;
    /** Own amount */
    own: bigint;
    /** Number of nominators */
    nominatorCount: number;
    /** Page count */
    pageCount: bigint;
}

/**
 * Detailed paged exposure metadata with account
 */
export interface PagedExposureMetadataDetail {
    /** Era number */
    era: number;
    /** Account ID as SS58 address */
    account: string;
    /** Paged exposure metadata */
    pagedExposureMetadata: PagedExposureMetadata;
}

/**
 * Staking validator information
 */
export interface StakingValidator {
    /** Commission rate */
    commission: string;
    /** Whether validator is blocked */
    blocked: boolean;
}

/**
 * Validator information for an era
 */
export interface ValidatorOnEra {
    /** Era */
    era: string;
    /** Reward amount */
    reward: bigint;
}

/**
 * Detailed staking validator information with account
 */
export interface StakingValidatorDetail {
    /** Staking validator information */
    stakingValidator: StakingValidator;
    /** Account ID as SS58 address */
    account: string;
}
