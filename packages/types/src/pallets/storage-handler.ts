import { Codec } from "@polkadot/types/types";
import { HexString } from "@polkadot/util/types";
import { Bytes, u128, u32 } from "@polkadot/types";
import { H256, Hash } from "@polkadot/types/interfaces";

/**
 * Type of storage order
 */
export type OrderType = 'Buy' | 'Expansion' | 'Renewal';

/**
 * Order ID which can be in multiple formats
 */
export type OrderId = string | Uint8Array | HexString | Bytes | null;

/**
 * Token which can be in multiple formats
 */
export type Token = Hash | H256 | string | Uint8Array | null;

/**
 * Space amount which can be in multiple formats
 */
export type Space = number | u32 | bigint | string | Uint8Array;

/**
 * Day count which can be in multiple formats
 */
export type Day = number | u32 | bigint | string | Uint8Array;

/**
 * Price amount which can be in multiple formats
 */
export type Price = u128 | bigint | string | Uint8Array;

/**
 * Consignment information
 */
export interface Consignment {
    /** User's account ID as SS58 address */
    user: string;
    /** Price amount */
    price: bigint;
    /** Buyers' account ID as SS58 address or null */
    buyers: string | null;
    /** Execution information */
    exec: number | null;
    /** Whether the consignment is locked */
    locked: boolean;
}

/**
 * Detailed consignment information with token
 */
export interface ConsignmentDetail {
    /** Token as hex string */
    token: string;
    /** Consignment information */
    consignmentInfo: Consignment;
}

/**
 * Storage handler order information
 */
export interface StorageHandlerOrder extends Codec {
    /** Territory name as hex string */
    territoryName: string;
    /** Payment amount */
    pay: bigint;
    /** Number of GiB */
    gibCount: number;
    /** Number of days */
    days: number;
    /** Expiration time */
    expired: number;
    /** Target account ID as SS58 address */
    targetAcc: string;
    /** Order type as hex string */
    orderType: string;
}

/**
 * Detailed storage handler order information with order ID
 */
export interface StorageHandlerOrderDetail extends Codec {
    /** Order ID as hex string */
    orderId: string;
    /** Order information */
    orderInfo: StorageHandlerOrder;
}

/**
 * Possible states of a territory
 */
export type TerritoryState = 'Active' | 'Frozen' | 'Expired' | 'OnConsignment';

/**
 * Detailed territory information with owner
 */
export interface TerritoryDetail {
    /** Owner's account ID as SS58 address */
    owner: string;
    /** Territory name */
    name: string;
    /** Territory information */
    territoryInfo: Territory;
}

/**
 * Territory information
 */
export interface Territory {
    /** Token as hex string */
    token: string;
    /** Total space amount */
    totalSpace: bigint;
    /** Used space amount */
    usedSpace: bigint;
    /** Locked space amount */
    lockedSpace: bigint;
    /** Remaining space amount */
    remainingSpace: bigint;
    /** Start time */
    start: number;
    /** Deadline time */
    deadline: number;
    /** Current state */
    state: TerritoryState;
}
