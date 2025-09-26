/*
 * Copyright (C) CESS. All rights reserved.
 * Copyright (C) Cumulus Encrypted Storage System. All rights reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import { AccountBalance, AccountIdInput, AccountInfoData, AccountInfoDetail, BlockNumberInput, HashInput, SysSyncState } from '@cessnetwork/types';
import { ApiPromise } from '@polkadot/api';
import { KeyringPair } from "@polkadot/keyring/types";
import type { SignedBlock } from "@polkadot/types/cjs/interfaces/runtime";
import type { ChainProperties, Health } from "@polkadot/types/cjs/interfaces/system";
import { isApiReady } from "@/utils/tx";
import { SDKError } from "@/utils";

export async function queryBlockNumberByHash(
    api: ApiPromise,
    hash?: HashInput
): Promise<number> {
    if (!hash) {
        const header = await api.rpc.chain.getHeader();
        return header.number.toNumber();
    } else {
        const header = await api.rpc.chain.getHeader(hash);
        return header.number.toNumber();
    }
}

export async function queryBlockHashByNumber(
    api: ApiPromise,
    block: BlockNumberInput
): Promise<string> {
    if (!block) {
        return (await api.rpc.chain.getBlockHash()).toString();
    } else {
        return (await api.rpc.chain.getBlockHash(block)).toString();
    }
}

export async function queryFinalizedHead(
    api: ApiPromise,
): Promise<any> {
    return (await api.rpc.chain.getFinalizedHead()).toHuman();
}

export async function queryBlockDataByHash(
    api: ApiPromise,
    hash?: HashInput
): Promise<SignedBlock> {
    if (!hash) {
        return api.rpc.chain.getBlock();
    } else {
        return api.rpc.chain.getBlock(hash);
    }
}

function jsonToAccountInfo(jsonData: any) {
    return {
        nonce: Number(jsonData.nonce),
        consumers: Number(jsonData.consumers),
        providers: Number(jsonData.providers),
        sufficients: Number(jsonData.sufficients),
        data: {
            free: BigInt(jsonData.data.free),
            reserved: BigInt(jsonData.data.reserved),
            frozen: BigInt(jsonData.data.frozen),
            flags: BigInt(jsonData.data.flags),
        } as unknown as AccountBalance
    } as unknown as AccountInfoData;
}

export async function queryAccountById(
    api: ApiPromise,
    accountId: AccountIdInput,
    block?: BlockNumberInput
): Promise<AccountInfoData | AccountInfoDetail[] | null> {
    const option = block ? await api.at(await api.rpc.chain.getBlockHash(block)) : api;
    if (accountId) {
        const result = await option.query.system.account(accountId);
        if (result.isEmpty) {
            return null;
        }
        const jsonData = result.toJSON() as any;
        return jsonToAccountInfo(jsonData);
    } else {
        const result = await option.query.system.account.entries();
        return result.map(([key, value]) => {
            return {
                account: key.args[0].toString(),
                accountInfo: jsonToAccountInfo(value.toJSON())
            } as unknown as AccountInfoDetail;
        });
    }
}

export async function queryChainName(
    api: ApiPromise,
): Promise<string> {
    return (await api.rpc.system.chain()).toString();
}

export async function queryChainType(
    api: ApiPromise,
): Promise<string> {
    return (await api.rpc.system.chainType()).toString();
}

export async function queryChainHealthStatus(
    api: ApiPromise,
): Promise<Health> {
    return (await api.rpc.system.health()).toHuman() as unknown as Health;
}

export async function queryChainProperties(
    api: ApiPromise,
): Promise<ChainProperties> {
    return (await api.rpc.system.properties()).toHuman() as unknown as ChainProperties;
}

export async function queryChainVersion(
    api: ApiPromise,
): Promise<string> {
    return (await api.rpc.system.version()).toString();
}

export async function queryCurrentNonce(
    api: ApiPromise,
    keyring: KeyringPair,
): Promise<number> {
    return await api.rpc.system.accountNextIndex(keyring.address).then((nonce) => {
        return nonce.toNumber()
    });
}

export async function getBlockByHash(
    api: ApiPromise,
    hash: HashInput
): Promise<SignedBlock> {
    if (!isApiReady(api)) {
        throw new SDKError('API Client is not ready', 'INVALID_API_CLIENT');
    }
    const block = await api.rpc.chain.getBlock(hash);
    if (!block) {
        throw new Error('RPC returned empty value');
    }
    return block;
}

export async function getBlockHashByBlockNum(
    api: ApiPromise,
    block?: BlockNumberInput
): Promise<string> {
    if (!isApiReady(api)) {
        throw new SDKError('API Client is not ready', 'INVALID_API_CLIENT');
    }
    const blockHash = await api.rpc.chain.getBlockHash(block);
    if (!blockHash || blockHash.isEmpty) {
        throw new Error('RPC returned empty value');
    }
    return blockHash.toString();
}

export async function getFinalizedHeadHash(
    api: ApiPromise
): Promise<string> {
    if (!isApiReady(api)) {
        throw new SDKError('API Client is not ready', 'INVALID_API_CLIENT');
    }
    const finalizedHead = await api.rpc.chain.getFinalizedHead();
    if (!finalizedHead || finalizedHead.isEmpty) {
        throw new Error('RPC returned empty value');
    }
    return finalizedHead.toString();
}

export async function isNetListening(
    api: ApiPromise
): Promise<boolean> {
    if (!isApiReady(api)) {
        throw new SDKError('API Client is not ready', 'INVALID_API_CLIENT');
    }
    const result = await api.rpc.net.listening();
    return result.valueOf();
}

export async function systemChain(
    api: ApiPromise
): Promise<string> {
    if (!isApiReady(api)) {
        throw new SDKError('API Client is not ready', 'INVALID_API_CLIENT');
    }
    const chain = await api.rpc.system.chain();
    return chain.toString();
}

export async function systemSyncState(
    api: ApiPromise
): Promise<SysSyncState> {
    if (!isApiReady(api)) {
        throw new SDKError('API Client is not ready', 'INVALID_API_CLIENT');
    }
    const syncState = await api.rpc.system.syncState();
    return syncState.toHuman() as unknown as SysSyncState;
}

export async function systemVersion(
    api: ApiPromise
): Promise<string> {
    if (!isApiReady(api)) {
        throw new SDKError('API Client is not ready', 'INVALID_API_CLIENT');
    }
    const version = await api.rpc.system.version();
    return version.toString();
}

export async function rotateKeys(
    api: ApiPromise,
): Promise<string> {
    return (await api.rpc.author.rotateKeys()).toString();
}