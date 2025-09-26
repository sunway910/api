/**
 * Block data information
 */
export interface BlockData {
    /** Block hash */
    blockHash: string;
    /** Previous block hash */
    preHash: string;
    /** Extrinsic hash */
    extHash: string;
    /** State hash */
    stHash: string;
    /** Total gas fee */
    allGasFee: string;
    /** Timestamp */
    timestamp: number;
    /** Block ID */
    blockId: number;
    /** Whether this is a new era */
    isNewEra: boolean;
    /** Era payment information */
    eraPaid: EraPaid;
    /** System events */
    sysEvents: string[];
    /** New accounts */
    newAccounts: string[];
    /** Generated challenges */
    genChallenge: string[];
    /** Completed storage operations */
    storageCompleted: string[];
    /** Miner registration information */
    minerReg: MinerRegInfo[];
    /** Extrinsics information */
    extrinsic: ExtrinsicsInfo[];
    /** Transfer information */
    transferInfo: TransferInfo[];
    /** Upload declaration information */
    uploadDecInfo: UploadDecInfo[];
    /** Delete file information */
    deleteFileInfo: DeleteFileInfo[];
    /** Idle proof submissions */
    submitIdleProve: SubmitIdleProve[];
    /** Service proof submissions */
    submitServiceProve: SubmitServiceProve[];
    /** Idle proof results */
    submitIdleResult: SubmitIdleResult[];
    /** Service proof results */
    submitServiceResult: SubmitServiceResult[];
    /** Punishment information */
    punishment: Punishment[];
    /** Miner registration PoIS keys */
    minerRegPoisKeys: MinerRegPoiskey[];
    /** Gateway registration */
    gatewayReg: GatewayReg[];
    /** Staking payouts */
    stakingPayouts: StakingPayout[];
    /** Unbonded information */
    unbonded: Unbonded[];
    /** Territory minting */
    mintTerritory: MintTerritory[];
}

/**
 * File data in a block
 */
export interface FileDataInBlock {
    /** Completed storage operations */
    storageCompleted: string[];
    /** Upload declaration information */
    uploadDecInfo: UploadDecInfo[];
    /** Delete file information */
    deleteFileInfo: DeleteFileInfo[];
    /** Timestamp */
    timestamp: number;
    /** Block ID */
    blockId: number;
}

/**
 * Information about extrinsics
 */
export interface ExtrinsicsInfo {
    /** Extrinsics name */
    name: string;
    /** Signer's account ID as SS58 address */
    signer: string;
    /** Hash */
    hash: string;
    /** Fee paid */
    feePaid: string;
    /** Result */
    result: boolean;
    /** Events */
    events: string[];
}

/**
 * Transfer information
 */
export interface TransferInfo {
    /** Extrinsics name */
    extrinsicName: string;
    /** Extrinsics hash */
    extrinsicHash: string;
    /** Sender's account ID as SS58 address */
    from: string;
    /** Receiver's account ID as SS58 address */
    to: string;
    /** Amount */
    amount: string;
    /** Result */
    result: boolean;
}

/**
 * Upload declaration information
 */
export interface UploadDecInfo {
    /** Extrinsics hash */
    extrinsicHash: string;
    /** Owner's account ID as SS58 address */
    owner: string;
    /** File ID */
    fid: string;
}

/**
 * Delete file information
 */
export interface DeleteFileInfo {
    /** Extrinsics hash */
    extrinsicHash: string;
    /** Owner's account ID as SS58 address */
    owner: string;
    /** File ID */
    fid: string;
}

/**
 * Miner registration information
 */
export interface MinerRegInfo {
    /** Extrinsics hash */
    extrinsicHash: string;
    /** Account ID as SS58 address */
    account: string;
}

/**
 * Idle proof submission
 */
export interface SubmitIdleProve {
    /** Extrinsics hash */
    extrinsicHash: string;
    /** Miner's account ID as SS58 address */
    miner: string;
}

/**
 * Service proof submission
 */
export interface SubmitServiceProve {
    /** Extrinsics hash */
    extrinsicHash: string;
    /** Miner's account ID as SS58 address */
    miner: string;
}

/**
 * Idle proof result
 */
export interface SubmitIdleResult {
    /** Extrinsics hash */
    extrinsicHash: string;
    /** Miner's account ID as SS58 address */
    miner: string;
    /** Result */
    result: boolean;
}

/**
 * Service proof result
 */
export interface SubmitServiceResult {
    /** Extrinsics hash */
    extrinsicHash: string;
    /** Miner's account ID as SS58 address */
    miner: string;
    /** Result */
    result: boolean;
}

/**
 * Punishment information
 */
export interface Punishment {
    /** Extrinsics name */
    extrinsicName: string;
    /** Extrinsics hash */
    extrinsicHash: string;
    /** From account ID as SS58 address */
    from: string;
    /** To account ID as SS58 address */
    to: string;
    /** Amount */
    amount: string;
}

/**
 * Miner registration PoIS key
 */
export interface MinerRegPoiskey {
    /** Extrinsics hash */
    extrinsicHash: string;
    /** Miner's account ID as SS58 address */
    miner: string;
}

/**
 * Gateway registration
 */
export interface GatewayReg {
    /** Extrinsics hash */
    extrinsicHash: string;
    /** Account ID as SS58 address */
    account: string;
}

/**
 * Era payment information
 */
export interface EraPaid {
    /** Whether there is a value */
    haveValue: boolean;
    /** Era index */
    eraIndex: number;
    /** Validator payout */
    validatorPayout: string;
    /** Remainder */
    remainder: string;
}

/**
 * Staking payout information
 */
export interface StakingPayout {
    /** Era index */
    eraIndex: number;
    /** Extrinsics hash */
    extrinsicHash: string;
    /** Claimed account ID as SS58 address */
    claimedAcc: string;
    /** Amount */
    amount: string;
}

/**
 * Unbonded information
 */
export interface Unbonded {
    /** Extrinsics hash */
    extrinsicHash: string;
    /** Account ID as SS58 address */
    account: string;
    /** Amount */
    amount: string;
}

/**
 * Territory minting information
 */
export interface MintTerritory {
    /** Extrinsics hash */
    extrinsicHash: string;
    /** Account ID as SS58 address */
    account: string;
    /** Territory token */
    territoryToken: string;
    /** Territory name */
    territoryName: string;
    /** Territory size */
    territorySize: number;
}