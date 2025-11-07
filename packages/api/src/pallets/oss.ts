/*
 * Copyright (C) CESS. All rights reserved.
 * Copyright (C) Cumulus Encrypted Storage System. All rights reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import { isValidUrl, SDKError } from "@/utils";
import { calculatePaymentInfo, executeTransaction, normalizeTransactionOptions, TransactionOptions, TransactionResult } from "@/utils/tx";
import { ApiPromise } from '@polkadot/api';
import { KeyringPair } from "@polkadot/keyring/types";
import { AccountIdInput, BlockNumberInput, OssAuthorityList, OssDetail, OssInfo, OssProxyAuthPayload, ProxySig } from '@cessnetwork/types';
import { hexToString } from "@polkadot/util";

export async function queryOssByAccountId(
    api: ApiPromise,
    accountId?: AccountIdInput,
    block?: BlockNumberInput
): Promise<OssInfo | OssDetail[] | null> {
    const option = block ? await api.at(await api.rpc.chain.getBlockHash(block)) : api;

    if (accountId) {
        const result = await option.query.oss.oss(accountId);
        if (result.isEmpty) {
            return null;
        }

        // Use toJSON() and convert fields properly
        const ossData = result.toJSON() as any;

        return {
            peerId: ossData.peerId.toString(),
            domain: hexToString(ossData.domain)
        } as OssInfo;
    } else {
        const result = await option.query.oss.oss.entries();
        return result.map(([key, value]) => {
            const ossData = value.toJSON() as any;

            return {
                account: key.args[0].toString(),
                ossInfo: {
                    peerId: ossData.peerId.toString(),
                    domain: hexToString(ossData.domain)
                } as OssInfo
            } as OssDetail;
        });
    }
}

export async function queryAuthorityListByAccountId(
    api: ApiPromise,
    accountId?: AccountIdInput,
    block?: BlockNumberInput
): Promise<string[] | OssAuthorityList[]> {
    const option = block ? await api.at(await api.rpc.chain.getBlockHash(block)) : api;

    if (accountId) {
        const result = await option.query.oss.authorityList(accountId);
        if (result.isEmpty) {
            return [];
        }

        // Use toJSON() and convert fields properly
        const ossData = result.toJSON() as any;

        // Convert array of authority accounts to AccountId[]
        return Array.isArray(ossData) ?
            ossData.map((account: any) => account.toString()) :
            [ossData.toString()];
    } else {
        const result = await option.query.oss.authorityList.entries();
        return result.map(([key, value]) => {
            const ossData = value.toJSON() as any;

            return {
                authorizedAcc: key.args[0].toString(),
                ossAcc: Array.isArray(ossData) ?
                    ossData.map((acc: any) => acc.toString()).join(',') :
                    [ossData.toString()]
            } as OssAuthorityList;
        });
    }
}

export async function queryOssAccByDomain(
    api: ApiPromise,
    domain: string,
): Promise<string> {
    if (!isValidUrl(domain)) {
        throw new SDKError(
            'invalid domain format',
            'INVALID_PARAMETERS'
        );
    } else {
        const ossAccList = await queryOssByAccountId(api) as unknown as OssDetail[]
        for (let i = 0; i < ossAccList.length; i++) {
            if (ossAccList[i].ossInfo.domain == domain) {
                return ossAccList[i].account
            }
        }
        return "";
    }
}

export async function authorize(
    api: ApiPromise,
    keyring: KeyringPair,
    accountId: AccountIdInput,
    options: TransactionOptions = {}
): Promise<TransactionResult> {
    if (!api?.tx?.oss?.authorize) {
        throw new SDKError(
            'oss.authorize method not available',
            'METHOD_NOT_AVAILABLE'
        );
    }

    const config = normalizeTransactionOptions(options);

    const tx = api.tx.oss.authorize(accountId);

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

export async function proxyAuthorize(
    api: ApiPromise,
    keyring: KeyringPair,
    authPub: AccountIdInput,
    sig: ProxySig,
    payload: OssProxyAuthPayload,
    options: TransactionOptions = {}
): Promise<TransactionResult> {
    if (!api?.tx?.oss?.proxyAuthorize) {
        throw new SDKError(
            'oss.proxyAuthorize method not available',
            'METHOD_NOT_AVAILABLE'
        );
    }

    const config = normalizeTransactionOptions(options);

    const tx = api.tx.oss.proxyAuthorize(authPub, sig, payload);

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

export async function cancelAuthorize(
    api: ApiPromise,
    keyring: KeyringPair,
    accountId: AccountIdInput,
    options: TransactionOptions = {}
): Promise<TransactionResult> {
    if (!api?.tx?.oss?.cancelAuthorize) {
        throw new SDKError(
            'oss.cancelAuthorize method not available',
            'METHOD_NOT_AVAILABLE'
        );
    }

    const config = normalizeTransactionOptions(options);

    const tx = api.tx.oss.cancelAuthorize(accountId);

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

export async function registerOssNode(
    api: ApiPromise,
    keyring: KeyringPair,
    domain: string,
    options: TransactionOptions = {}
): Promise<TransactionResult> {
    if (!api?.tx?.oss?.register) {
        throw new SDKError(
            'oss.register method not available',
            'METHOD_NOT_AVAILABLE'
        );
    }

    const config = normalizeTransactionOptions(options);

    // peerId is deprecated, but still required in request payload
    const tx = api.tx.oss.register("", domain);

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

export async function updateOssEndpoint(
    api: ApiPromise,
    keyring: KeyringPair,
    domain: string,
    options: TransactionOptions = {}
): Promise<TransactionResult> {

    if (!api?.tx?.oss?.update) {
        throw new SDKError(
            'oss.update method not available',
            'METHOD_NOT_AVAILABLE'
        );
    }

    const config = normalizeTransactionOptions(options);

    // peerId is deprecated, but still required in request payload
    const tx = api.tx.oss.update("", domain);

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

export async function destroyOss(
    api: ApiPromise,
    keyring: KeyringPair,
    options: TransactionOptions = {}
): Promise<TransactionResult> {
    if (!api?.tx?.oss?.destroy) {
        throw new SDKError(
            'oss.destroy method not available',
            'METHOD_NOT_AVAILABLE'
        );
    }

    const config = normalizeTransactionOptions(options);

    const tx = api.tx.oss.destroy();

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
