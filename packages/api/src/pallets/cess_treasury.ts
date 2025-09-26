/*
 * Copyright (C) CESS. All rights reserved.
 * Copyright (C) Cumulus Encrypted Storage System. All rights reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import { BlockNumberInput, EraInput } from "@cessnetwork/types";
import { ApiPromise } from '@polkadot/api';
import { hexToBigInt } from "@polkadot/util";

export async function queryCurrencyReward(
    api: ApiPromise,
    block?: BlockNumberInput
): Promise<bigint> {
    const option = block ? await api.at(await api.rpc.chain.getBlockHash(block)) : api;
    const result = await option.query.cessTreasury.currencyReward();
    return BigInt(result.toString());
}

export async function queryEraReward(
    api: ApiPromise,
    block?: BlockNumberInput
): Promise<bigint> {
    const option = block ? await api.at(await api.rpc.chain.getBlockHash(block)) : api;
    const result = await option.query.cessTreasury.eraReward();
    return BigInt(result.toString());
}

export async function queryReserveReward(
    api: ApiPromise,
    block?: BlockNumberInput
): Promise<bigint> {
    const option = block ? await api.at(await api.rpc.chain.getBlockHash(block)) : api;
    const result = await option.query.cessTreasury.reserveReward();
    return BigInt(result.toString());
}

export async function queryRoundReward(
    api: ApiPromise,
    era: EraInput,
    block?: BlockNumberInput
): Promise<bigint> {
    const option = block ? await api.at(await api.rpc.chain.getBlockHash(block)) : api;
    const result = await option.query.cessTreasury.roundReward(era);
    return hexToBigInt((result.toJSON() as any)[0]);
}