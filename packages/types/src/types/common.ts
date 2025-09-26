/*
    Copyright (C) CESS. All rights reserved.
    Copyright (C) Cumulus Encrypted Storage System. All rights reserved.

    SPDX-License-Identifier: Apache-2.0
*/

import { AccountId, Balance, BlockHash, BlockNumber, H256, H512, Hash, MultiAddress } from '@polkadot/types/interfaces';
import { u32 } from "@polkadot/types";

// Unit precision of CESS token
export const TokenPrecision_CESS = BigInt(10 ** 18);

export const StakeForOneTB = BigInt(4000 * (10 ** 18));

export const BlockIntervalSec = 6;

export const CESSWalletLen = 49;

// BlockInterval is the time interval for generating blocks, in seconds
export const BlockInterval = 1000 * BlockIntervalSec;

export const TreasuryAccount = "cXhT9Xh3DhrBMDmXcGeMPDmTzDm1J8vDxBtKvogV33pShnWS";

export enum Size {
    SIZE_1KiB = 1024,
    SIZE_1MiB = 1024 * 1024,
    SIZE_1GiB = 1024 * 1024 * 1024,
    SIZE_1TiB = 1024 * 1024 * 1024 * 1024
}

export enum AddressSs58Format {
    TEST_NET = 11330,
    MAIN_NET = 11331,
}

export const NumberOfDataCopies = 3;
export const SegmentSize = 32 * Size.SIZE_1MiB;
export const FragmentSize = 8 * Size.SIZE_1MiB;
export const DataShards = 4;
export const ParShards = 8;
export const TotalShards = DataShards + ParShards;

export type AccountIdInput = AccountId | string | Uint8Array;
export type EraInput = number | string | u32;
export type MultiAddressInput = MultiAddress | AccountIdInput;
export type BlockNumberInput = BlockNumber | number | string | Uint8Array;
export type BalanceInput = Balance | bigint | string | number;
export type HashInput = string | Uint8Array | BlockHash | H256;
export type TxHashInput = string | Hash | Uint8Array;
export type BlockHashInput = string | Hash | Uint8Array | BlockHash;
export type CommonHash = string | H512 | Uint8Array;