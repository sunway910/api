/*
 * Copyright (C) CESS. All rights reserved.
 * Copyright (C) Cumulus Encrypted Storage System. All rights reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import { ApiPromise } from '@polkadot/api';
import { Endpoints, TeeMasterKeyStatus, WorkerAddedAt, TeeWorkerDetail, TeeWorker, BlockNumberInput, TeeWorkerPublicKey } from '@cessnetwork/types';

export async function queryMasterPubKey(
    api: ApiPromise,
    block?: BlockNumberInput
): Promise<TeeMasterKeyStatus | null> {
    const option = block ? await api.at(await api.rpc.chain.getBlockHash(block)) : api;
    const result = await option.query.teeWorker.masterKeyStatus();

    if (result.isEmpty) {
        return null;
    }

    // Use toJSON() and convert fields properly
    const masterKeyData = result.toJSON() as any;

    return {
        launched: {
            pubkey: masterKeyData.launched.pubkey,
            holder: masterKeyData.launched.holder,
            launchedAt: {
                era: Number(masterKeyData.launched.launchedAt[0]),
                startTime: Number(masterKeyData.launched.launchedAt[1])
            }
        }
    } as TeeMasterKeyStatus;
}

function JsonToTeeWorker(workerData: TeeWorker) {
    return {
        pubkey: workerData.pubkey,
        ecdhPubkey: workerData.ecdhPubkey,
        version: Number(workerData.version),
        lastUpdated: Number(workerData.lastUpdated),
        stashAccount: workerData.stashAccount || null,
        attestationProvider: workerData.attestationProvider,
        confidenceLevel: Number(workerData.confidenceLevel),
        features: Array.isArray(workerData.features) ?
            workerData.features.map((f: any) => Number(f)) : [],
        role: workerData.role,
        endpoint: workerData.endpoint
    } as TeeWorker;
}

export async function queryWorkerByPubKey(
    api: ApiPromise,
    workerPublicKey?: TeeWorkerPublicKey,
    block?: BlockNumberInput
): Promise<TeeWorker | TeeWorkerDetail[] | null> {
    const option = block ? await api.at(await api.rpc.chain.getBlockHash(block)) : api;

    if (workerPublicKey) {
        const result = await option.query.teeWorker.workers(workerPublicKey);
        if (result.isEmpty) {
            return null;
        }

        // Use toJSON() and convert fields properly
        const workerData = result.toJSON() as any;

        return JsonToTeeWorker(workerData);
    } else {
        const result = await option.query.teeWorker.workers.entries();
        return result.map(([key, value]) => {
            const workerData = value.toJSON() as any;

            return {
                publicKey: key.args[0].toString(),
                teeWorker: JsonToTeeWorker(workerData)
            } as TeeWorkerDetail;
        });
    }
}

export async function queryEndpointByPubKey(
    api: ApiPromise,
    workerPublicKey?: TeeWorkerPublicKey,
    block?: BlockNumberInput
): Promise<string | Endpoints[] | null> {
    const option = block ? await api.at(await api.rpc.chain.getBlockHash(block)) : api;

    if (workerPublicKey) {
        const result = await option.query.teeWorker.endpoints(workerPublicKey);
        if (result.isEmpty) {
            return null;
        }
        // Endpoint is already a string, just convert to string
        return result.toString();
    } else {
        const result = await option.query.teeWorker.endpoints.entries();
        return result.map(([key, value]) => {
            return {
                publicKey: key.args[0].toString(),
                endpoint: value.toString()
            } as Endpoints;
        });
    }
}

export async function queryWorkerStartBlockByPubKey(
    api: ApiPromise,
    workerPublicKey?: TeeWorkerPublicKey,
    block?: BlockNumberInput
): Promise<number | WorkerAddedAt[]> {
    const option = block ? await api.at(await api.rpc.chain.getBlockHash(block)) : api;

    if (workerPublicKey) {
        const result = await option.query.teeWorker.workerAddedAt(workerPublicKey);
        if (result.isEmpty) {
            return 0;
        }
        // Block number is numeric, convert properly
        return Number(result.toString());
    } else {
        const result = await option.query.teeWorker.workerAddedAt.entries();
        return result.map(([key, value]) => {
            return {
                publicKey: key.args[0].toString(),
                blockNumber: Number(value.toString())
            } as WorkerAddedAt;
        });
    }
}

export async function queryWorkerCount(
    api: ApiPromise,
    block?: BlockNumberInput
): Promise<number> {
    const option = block ? await api.at(await api.rpc.chain.getBlockHash(block)) : api;
    const result = await option.query.teeWorker.counterForWorkers();
    return Number(result.toString());
}