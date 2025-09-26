/*
 * Copyright (C) CESS. All rights reserved.
 * Copyright (C) Cumulus Encrypted Storage System. All rights reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import { ApiPromise } from '@polkadot/api';
import { BlockNumberInput } from '@cessnetwork/types';

export async function queryValidators(
    api: ApiPromise,
    block?: BlockNumberInput
): Promise<string[]> {
    const option = block ? await api.at(await api.rpc.chain.getBlockHash(block)) : api;
    const result = await option.query.session.validators();
    if (result.isEmpty) {
        return [];
    }
    return result.toJSON() as unknown as string[];
}

export async function queryDisabledValidatorsFromSession(
    api: ApiPromise,
    block?: BlockNumberInput
): Promise<string[]> {
    const option = block ? await api.at(await api.rpc.chain.getBlockHash(block)) : api;
    const result = await option.query.session.disabledValidators();
    if (result.isEmpty) {
        return [];
    }
    return result.toJSON() as unknown as string[];
}
