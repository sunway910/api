/**
 * System properties information
 */
export interface SystemProperties {
    /** Whether the chain is Ethereum-based */
    isEthereum: boolean;
    /** SS58 address format */
    ss58Format: number;
    /** Token decimals for each token */
    tokenDecimals: number[];
    /** Token symbols */
    tokenSymbol: string[];
}

/**
 * System synchronization state
 */
export interface SysSyncState {
    /** Starting block number */
    startingBlock: number;
    /** Current block number */
    currentBlock: number;
    /** Highest block number */
    highestBlock: number;
}

/**
 * Detailed account information with account ID
 */
export interface AccountInfoDetail {
    /** Account ID */
    account: string;
    /** Account information data */
    accountInfo: AccountInfoData;
}

/**
 * Account information data
 */
export interface AccountInfoData {
    /** Nonce value */
    nonce: number;
    /** Number of consumers */
    consumers: number;
    /** Number of providers */
    providers: number;
    /** Number of sufficients */
    sufficients: number;
    /** Account balance information */
    data: AccountBalance;
}

/**
 * Account balance information
 */
export interface AccountBalance {
    /** Free balance */
    free: bigint;
    /** Reserved balance */
    reserved: bigint;
    /** Frozen balance */
    frozen: bigint;
    /** Balance flags */
    flags: bigint;
}

