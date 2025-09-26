/*
 * Copyright (C) CESS. All rights reserved.
 * Copyright (C) Cumulus Encrypted Storage System. All rights reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import { SDKError } from "@/utils";
import { calculatePaymentInfo, executeTransaction, normalizeTransactionOptions, TransactionOptions, TransactionResult } from "@/utils/tx";
import {
    AccountIdInput,
    Accumulator,
    BlockNumberInput,
    BloomFilter,
    ChallengeInfo,
    SpaceProof,
    TeeSig,
    TeeWorkerPublicKey
} from "@cessnetwork/types";
import { ApiPromise } from '@polkadot/api';
import { KeyringPair } from "@polkadot/keyring/types";
import { u32, u64, bool } from '@polkadot/types';

export async function queryChallengeSnapShot(
    api: ApiPromise,
    accountId: AccountIdInput,
    block?: BlockNumberInput
): Promise<ChallengeInfo | null> {
    const option = block ? await api.at(await api.rpc.chain.getBlockHash(block)) : api;
    const result = await option.query.audit.challengeSnapShot(accountId);
    if (result.isEmpty) {
        return null;
    }
    return result.toJSON() as unknown as ChallengeInfo;
}

export async function queryCountedClear(
    api: ApiPromise,
    accountId: AccountIdInput,
    block?: BlockNumberInput
): Promise<number> {
    const option = block ? await api.at(await api.rpc.chain.getBlockHash(block)) : api;
    const result = await option.query.audit.countedClear(accountId);
    if (result.isEmpty) {
        return 0;
    }
    return Number(result.toString());
}

export async function updateCountedClear(
    api: ApiPromise,
    keyring: KeyringPair,
    accountId: AccountIdInput,
    options: TransactionOptions = {}
): Promise<TransactionResult> {
    if (!api?.tx?.audit?.updateCountedClear) {
        throw new SDKError(
            'audit.updateCountedClear method not available',
            'METHOD_NOT_AVAILABLE'
        );
    }

    const config = normalizeTransactionOptions(options);

    const tx = api.tx.audit.updateCountedClear(accountId);

    const paymentInfo = config.includePaymentInfo
        ? await calculatePaymentInfo(tx, keyring.address, config.logger)
        : undefined;

    return executeTransaction(
        api,
        tx,
        keyring,
        config,
        paymentInfo
    );
}

export async function queryCountedServiceFailed(
    api: ApiPromise,
    accountId: AccountIdInput,
    block?: BlockNumberInput
): Promise<number> {
    const option = block ? await api.at(await api.rpc.chain.getBlockHash(block)) : api;
    const result = await option.query.audit.countedServiceFailed(accountId);
    if (result.isEmpty) {
        return 0;
    }
    return (result as unknown as u32).toNumber();
}

export async function submitIdleProof(
    api: ApiPromise,
    keyring: KeyringPair,
    idleProof: SpaceProof,
    options: TransactionOptions = {}
): Promise<TransactionResult> {
    if (!api?.tx?.audit?.submitIdleProof) {
        throw new SDKError(
            'audit.submitIdleProof method not available',
            'METHOD_NOT_AVAILABLE'
        );
    }

    const config = normalizeTransactionOptions(options);

    const tx = api.tx.audit.submitIdleProof(idleProof);

    const paymentInfo = config.includePaymentInfo
        ? await calculatePaymentInfo(tx, keyring.address, config.logger)
        : undefined;

    return executeTransaction(
        api,
        tx,
        keyring,
        config,
        paymentInfo
    );
}

export async function submitServiceProof(
    api: ApiPromise,
    keyring: KeyringPair,
    serviceProof: SpaceProof,
    options: TransactionOptions = {}
): Promise<TransactionResult> {
    if (!api?.tx?.audit?.submitServiceProof) {
        throw new SDKError(
            'audit.submitServiceProof method not available',
            'METHOD_NOT_AVAILABLE'
        );
    }

    const config = normalizeTransactionOptions(options);

    const tx = api.tx.audit.submitServiceProof(serviceProof);

    const paymentInfo = config.includePaymentInfo
        ? await calculatePaymentInfo(tx, keyring.address, config.logger)
        : undefined;

    return executeTransaction(
        api,
        tx,
        keyring,
        config,
        paymentInfo
    );
}

export async function submitVerifyIdleResult(
    api: ApiPromise,
    keyring: KeyringPair,
    totalProofHash: string | Uint8Array,
    front: number | u64 | bigint,
    rear: number | u64 | bigint,
    accumulator: Accumulator,
    result: Boolean | bool,
    sig: TeeSig,
    teePuk: TeeWorkerPublicKey,
    options: TransactionOptions = {}
): Promise<TransactionResult> {
    if (!api?.tx?.audit?.submitVerifyIdleResult) {
        throw new SDKError(
            'audit.submitVerifyIdleResult method not available',
            'METHOD_NOT_AVAILABLE'
        );
    }

    const config = normalizeTransactionOptions(options);

    const tx = api.tx.audit.submitVerifyIdleResult(
        totalProofHash,
        front,
        rear,
        accumulator,
        result,
        sig,
        teePuk
    );

    const paymentInfo = config.includePaymentInfo
        ? await calculatePaymentInfo(tx, keyring.address, config.logger)
        : undefined;

    return executeTransaction(
        api,
        tx,
        keyring,
        config,
        paymentInfo
    );
}

export async function submitVerifyServiceResult(
    api: ApiPromise,
    keyring: KeyringPair,
    serviceResult: bool | Boolean,
    signature: TeeSig,
    bloomFilter: BloomFilter,
    teePuk: TeeWorkerPublicKey,
    options: TransactionOptions = {}
): Promise<TransactionResult> {
    if (!api?.tx?.audit?.submitVerifyServiceResult) {
        throw new SDKError(
            'audit.submitVerifyServiceResult method not available',
            'METHOD_NOT_AVAILABLE'
        );
    }

    const config = normalizeTransactionOptions(options);

    const tx = api.tx.audit.submitVerifyServiceResult(serviceResult, signature, bloomFilter, teePuk);

    const paymentInfo = config.includePaymentInfo
        ? await calculatePaymentInfo(tx, keyring.address, config.logger)
        : undefined;

    return executeTransaction(
        api,
        tx,
        keyring,
        config,
        paymentInfo
    );
}
