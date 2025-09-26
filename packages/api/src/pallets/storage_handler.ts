/*
 * Copyright (C) CESS. All rights reserved.
 * Copyright (C) Cumulus Encrypted Storage System. All rights reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import { ApiPromise } from '@polkadot/api';
import {
    Territory,
    Consignment,
    StorageHandlerOrder,
    ConsignmentDetail,
    StorageHandlerOrderDetail,
    TerritoryDetail,
    OrderType,
    BlockNumberInput,
    OrderId,
    AccountIdInput,
    Token,
    Space,
    Day,
    Price
} from '@cessnetwork/types';
import { KeyringPair } from "@polkadot/keyring/types";
import { SDKError } from '@/utils';
import {
    calculatePaymentInfo, executeTransaction,
    normalizeTransactionOptions,
    TransactionOptions,
    TransactionResult
} from "@/utils/tx";
import { hexToString } from "@polkadot/util";

export async function queryUnitPrice(api: ApiPromise, block?: BlockNumberInput): Promise<bigint> {
    const option = block ? await api.at(await api.rpc.chain.getBlockHash(block)) : api;
    const result = await option.query.storageHandler.unitPrice();
    return result.isEmpty ? 0n : BigInt(result.toString());
}

export async function queryTotalIdleSpace(api: ApiPromise, block?: BlockNumberInput): Promise<bigint> {
    const option = block ? await api.at(await api.rpc.chain.getBlockHash(block)) : api;
    const result = await option.query.storageHandler.totalIdleSpace();
    return result.isEmpty ? 0n : BigInt(result.toString());
}

export async function queryTotalServiceSpace(api: ApiPromise, block?: BlockNumberInput): Promise<bigint> {
    const option = block ? await api.at(await api.rpc.chain.getBlockHash(block)) : api;
    const result = await option.query.storageHandler.totalServiceSpace();
    return result.isEmpty ? 0n : BigInt(result.toString());
}

export async function queryPurchasedSpace(api: ApiPromise, block?: BlockNumberInput): Promise<bigint> {
    const option = block ? await api.at(await api.rpc.chain.getBlockHash(block)) : api;
    const result = await option.query.storageHandler.purchasedSpace();
    return result.isEmpty ? 0n : BigInt(result.toString());
}

export async function queryPayOrder(
    api: ApiPromise,
    orderId?: OrderId,
    block?: BlockNumberInput
): Promise<StorageHandlerOrder | StorageHandlerOrderDetail[] | null> {
    const option = block
        ? await api.at(await api.rpc.chain.getBlockHash(block))
        : api;

    if (!orderId) {
        const result = await option.query.storageHandler.payOrder.entries();
        return result.length < 1 ? null : result.map(([key, value]) => {
            const orderData = value.toJSON() as any;
            return {
                orderId: key.args[0].toString(),
                orderInfo: StorageHandlerTypeConverter.convertToStorageHandlerOrder(orderData)
            } as StorageHandlerOrderDetail;
        });
    } else {
        const result = await option.query.storageHandler.payOrder(orderId);
        if (result.isEmpty) {
            return null;
        }
        const orderData = result.toJSON() as any;
        return StorageHandlerTypeConverter.convertToStorageHandlerOrder(orderData);
    }
}

export async function queryTerritory(
    api: ApiPromise,
    accountId: AccountIdInput,
    territoryName?: string,
    block?: BlockNumberInput
): Promise<Territory | TerritoryDetail[] | null> {
    const option = block ? await api.at(await api.rpc.chain.getBlockHash(block)) : api;

    if (!territoryName) {
        const result = await option.query.storageHandler.territory.entries(accountId);

        return result.length < 1 ? null : result.map(([key, value]) => {
            const territoryData = value.toJSON() as any;
            return {
                owner: key.args[0].toString(),
                name: key.args[1].toHuman(),
                territoryInfo: StorageHandlerTypeConverter.convertToTerritory(territoryData)
            } as TerritoryDetail;
        });
    } else {
        const result = await option.query.storageHandler.territory(accountId, territoryName);
        if (result.isEmpty) {
            return null;
        }
        const territoryData = result.toJSON() as any;
        return StorageHandlerTypeConverter.convertToTerritory(territoryData);
    }
}

export async function queryConsignment(
    api: ApiPromise,
    token?: Token,
    block?: BlockNumberInput
): Promise<Consignment | ConsignmentDetail[] | null> {
    const option = block ? await api.at(await api.rpc.chain.getBlockHash(block)) : api;

    if (!token) {
        const result = await option.query.storageHandler.consignment.entries();
        return result.length < 1 ? null : result.map(([key, value]) => {
            const consignmentData = value.toJSON() as any;
            return {
                token: key.args[0].toString(),
                consignmentInfo: StorageHandlerTypeConverter.convertToConsignment(consignmentData)
            } as ConsignmentDetail;
        });
    } else {
        const result = await option.query.storageHandler.consignment(token);
        if (result.isEmpty) {
            return null;
        }
        const consignmentData = result.toJSON() as any;
        return StorageHandlerTypeConverter.convertToConsignment(consignmentData);
    }
}

export async function mintTerritory(
    api: ApiPromise,
    keyring: KeyringPair,
    gibCount: Space,
    territoryName: string,
    days: Day,
    options: TransactionOptions = {}
): Promise<TransactionResult> {
    if (!api?.tx?.storageHandler?.mintTerritory) {
        throw new SDKError(
            'storageHandler.mintTerritory method not available',
            'METHOD_NOT_AVAILABLE'
        );
    }

    // days must >= 30
    if (typeof days !== 'number' && !days) {
        throw new SDKError('days is required and must be >= 30', 'INVALID_PARAMETER');
    }

    const config = normalizeTransactionOptions(options);

    // Pre-create transaction for reuse
    const tx = api.tx.storageHandler.mintTerritory(gibCount, territoryName, days);

    // Pre-calculate payment info if needed
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

export async function expandingTerritory(
    api: ApiPromise,
    keyring: KeyringPair,
    territoryName: string,
    gibCount: Space,
    options: TransactionOptions = {}
): Promise<TransactionResult> {
    if (!api?.tx?.storageHandler?.expandingTerritory) {
        throw new SDKError(
            'storageHandler.expandingTerritory method not available',
            'METHOD_NOT_AVAILABLE'
        );
    }

    if (!territoryName) {
        throw new SDKError('territoryName is required', 'INVALID_PARAMETER');
    }

    if (typeof gibCount !== 'number' && !gibCount) {
        throw new SDKError('gibCount is required', 'INVALID_PARAMETER');
    }

    if (typeof gibCount === 'number' && gibCount <= 0) {
        throw new SDKError('gibCount must be greater than 0', 'INVALID_PARAMETER');
    }

    const config = normalizeTransactionOptions(options);
    const tx = api.tx.storageHandler.expandingTerritory(territoryName, gibCount);

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

export async function renewalTerritory(
    api: ApiPromise,
    keyring: KeyringPair,
    territoryName: string,
    daysCount: Day,
    options: TransactionOptions = {}
): Promise<TransactionResult> {
    if (!api?.tx?.storageHandler?.renewalTerritory) {
        throw new SDKError(
            'storageHandler.renewalTerritory method not available',
            'METHOD_NOT_AVAILABLE'
        );
    }

    if (!territoryName) {
        throw new SDKError('territoryName is required', 'INVALID_PARAMETER');
    }

    if (typeof daysCount !== 'number' && !daysCount) {
        throw new SDKError('daysCount is required', 'INVALID_PARAMETER');
    }

    if (typeof daysCount === 'number' && daysCount <= 0) {
        throw new SDKError('daysCount must be greater than 0', 'INVALID_PARAMETER');
    }

    const config = normalizeTransactionOptions(options);
    const tx = api.tx.storageHandler.renewalTerritory(territoryName, daysCount);

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

export async function reactivateTerritory(
    api: ApiPromise,
    keyring: KeyringPair,
    territoryName: string,
    days: Day,
    options: TransactionOptions = {}
): Promise<TransactionResult> {
    if (!api?.tx?.storageHandler?.reactivateTerritory) {
        throw new SDKError(
            'storageHandler.reactivateTerritory method not available',
            'METHOD_NOT_AVAILABLE'
        );
    }

    if (!territoryName) {
        throw new SDKError('territoryName is required', 'INVALID_PARAMETER');
    }

    if (typeof days !== 'number' && !days) {
        throw new SDKError('daysCount is required', 'INVALID_PARAMETER');
    }

    if (typeof days === 'number' && days <= 0) {
        throw new SDKError('daysCount must be greater than 0', 'INVALID_PARAMETER');
    }

    const config = normalizeTransactionOptions(options);
    const tx = api.tx.storageHandler.reactivateTerritory(territoryName, days);

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

export async function territoryConsignment(
    api: ApiPromise,
    keyring: KeyringPair,
    territoryName: string,
    price: Price,
    options: TransactionOptions = {}
): Promise<TransactionResult> {
    if (!api?.tx?.storageHandler?.territoryConsignment) {
        throw new SDKError(
            'storageHandler.territoryConsignment method not available',
            'METHOD_NOT_AVAILABLE'
        );
    }

    if (!territoryName) {
        throw new SDKError('territoryName is required', 'INVALID_PARAMETER');
    }

    if (!price) {
        throw new SDKError('price is required', 'INVALID_PARAMETER');
    }

    const config = normalizeTransactionOptions(options);
    const tx = api.tx.storageHandler.territoryConsignment(territoryName, price);

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

export async function cancelConsignment(
    api: ApiPromise,
    keyring: KeyringPair,
    territoryName: string,
    options: TransactionOptions = {}
): Promise<TransactionResult> {
    if (!api?.tx?.storageHandler?.cancelConsignment) {
        throw new SDKError(
            'storageHandler.cancelConsignment method not available',
            'METHOD_NOT_AVAILABLE'
        );
    }

    if (!territoryName) {
        throw new SDKError('territoryName is required', 'INVALID_PARAMETER');
    }

    const config = normalizeTransactionOptions(options);
    const tx = api.tx.storageHandler.cancelConsignment(territoryName);

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

export async function buyConsignment(
    api: ApiPromise,
    keyring: KeyringPair,
    token: Token,
    territoryName: string,
    options: TransactionOptions = {}
): Promise<TransactionResult> {
    if (!api?.tx?.storageHandler?.buyConsignment) {
        throw new SDKError(
            'storageHandler.buyConsignment method not available',
            'METHOD_NOT_AVAILABLE'
        );
    }

    if (!token) {
        throw new SDKError('token is required', 'INVALID_PARAMETER');
    }

    if (!territoryName) {
        throw new SDKError('territoryName is required', 'INVALID_PARAMETER');
    }

    const config = normalizeTransactionOptions(options);
    const tx = api.tx.storageHandler.buyConsignment(token, territoryName);

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

export async function cancelPurchaseAction(
    api: ApiPromise,
    keyring: KeyringPair,
    token: Token,
    options: TransactionOptions = {}
): Promise<TransactionResult> {
    if (!api?.tx?.storageHandler?.cancelPurchaseAction) {
        throw new SDKError(
            'storageHandler.cancelPurchaseAction method not available',
            'METHOD_NOT_AVAILABLE'
        );
    }

    if (!token) {
        throw new SDKError('token is required', 'INVALID_PARAMETER');
    }

    const config = normalizeTransactionOptions(options);
    const tx = api.tx.storageHandler.cancelPurchaseAction(token);

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

export async function clearServiceSpace(
    api: ApiPromise,
    keyring: KeyringPair,
    options: TransactionOptions = {}
): Promise<TransactionResult> {
    if (!api?.tx?.storageHandler?.clearServiceSpace) {
        throw new SDKError(
            'storageHandler.clearServiceSpace method not available',
            'METHOD_NOT_AVAILABLE'
        );
    }

    const config = normalizeTransactionOptions(options);
    const tx = api.tx.storageHandler.clearServiceSpace();

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

export async function createOrder(
    api: ApiPromise,
    keyring: KeyringPair,
    targetAcc: AccountIdInput,
    territoryName: string,
    orderType: OrderType,
    gibCount: Space,
    days: Day,
    expiredAfterNMinutes: number,
    options: TransactionOptions = {}
): Promise<TransactionResult> {
    if (!api?.tx?.storageHandler?.createOrder) {
        throw new SDKError(
            'storageHandler.createOrder method not available',
            'METHOD_NOT_AVAILABLE'
        );
    }

    if (!targetAcc) {
        throw new SDKError('targetAcc is required', 'INVALID_PARAMETER');
    }

    if (!territoryName) {
        throw new SDKError('territoryName is required', 'INVALID_PARAMETER');
    }

    if (!orderType) {
        throw new SDKError('orderType is required', 'INVALID_PARAMETER');
    }

    if (!gibCount) {
        throw new SDKError('gibCount is required', 'INVALID_PARAMETER');
    }

    if (!days) {
        throw new SDKError('days is required', 'INVALID_PARAMETER');
    }

    if (!expiredAfterNMinutes) {
        throw new SDKError('expired is required', 'INVALID_PARAMETER');
    }

    const config = normalizeTransactionOptions(options);
    const tx = api.tx.storageHandler.createOrder(targetAcc, territoryName, orderType, gibCount, days, expiredAfterNMinutes);

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

export async function defineUpdatePrice(
    api: ApiPromise,
    keyring: KeyringPair,
    price: Price,
    options: TransactionOptions = {}
): Promise<TransactionResult> {
    if (!api?.tx?.storageHandler?.defineUpdatePrice) {
        throw new SDKError(
            'storageHandler.defineUpdatePrice method not available',
            'METHOD_NOT_AVAILABLE'
        );
    }

    if (!price) {
        throw new SDKError('price is required', 'INVALID_PARAMETER');
    }

    const config = normalizeTransactionOptions(options);
    const tx = api.tx.storageHandler.defineUpdatePrice(price);

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

export async function execConsignment(
    api: ApiPromise,
    keyring: KeyringPair,
    token: Token,
    territoryName: string,
    options: TransactionOptions = {}
): Promise<TransactionResult> {
    if (!api?.tx?.storageHandler?.execConsignment) {
        throw new SDKError(
            'storageHandler.execConsignment method not available',
            'METHOD_NOT_AVAILABLE'
        );
    }

    if (!token) {
        throw new SDKError('token is required', 'INVALID_PARAMETER');
    }

    if (!territoryName) {
        throw new SDKError('territoryName is required', 'INVALID_PARAMETER');
    }

    const config = normalizeTransactionOptions(options);
    const tx = api.tx.storageHandler.execConsignment(token, territoryName);

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

export async function execOrder(
    api: ApiPromise,
    keyring: KeyringPair,
    orderId: OrderId,
    options: TransactionOptions = {}
): Promise<TransactionResult> {
    if (!api?.tx?.storageHandler?.execOrder) {
        throw new SDKError(
            'storageHandler.execOrder method not available',
            'METHOD_NOT_AVAILABLE'
        );
    }

    if (!orderId) {
        throw new SDKError('orderId is required', 'INVALID_PARAMETER');
    }

    const config = normalizeTransactionOptions(options);
    const tx = api.tx.storageHandler.execOrder(orderId);

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

export async function fixTerritorySpaceForReactivate(
    api: ApiPromise,
    keyring: KeyringPair,
    acc: AccountIdInput,
    territoryName: string,
    options: TransactionOptions = {}
): Promise<TransactionResult> {
    if (!api?.tx?.storageHandler?.fixTerritorySpaceForReactivate) {
        throw new SDKError(
            'storageHandler.fixTerritorySpaceForReactivate method not available',
            'METHOD_NOT_AVAILABLE'
        );
    }

    if (!acc) {
        throw new SDKError('acc is required', 'INVALID_PARAMETER');
    }

    if (!territoryName) {
        throw new SDKError('territoryName is required', 'INVALID_PARAMETER');
    }

    const config = normalizeTransactionOptions(options);
    const tx = api.tx.storageHandler.fixTerritorySpaceForReactivate(acc, territoryName);

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

export async function otherReactivateTerritory(
    api: ApiPromise,
    keyring: KeyringPair,
    targetAcc: AccountIdInput,
    territoryName: string,
    days: Day,
    options: TransactionOptions = {}
): Promise<TransactionResult> {
    if (!api?.tx?.storageHandler?.otherReactivateTerritory) {
        throw new SDKError(
            'storageHandler.otherReactivateTerritory method not available',
            'METHOD_NOT_AVAILABLE'
        );
    }

    if (!targetAcc) {
        throw new SDKError('targetAcc is required', 'INVALID_PARAMETER');
    }

    if (!territoryName) {
        throw new SDKError('territoryName is required', 'INVALID_PARAMETER');
    }

    if (!days) {
        throw new SDKError('days is required', 'INVALID_PARAMETER');
    }

    if (Number(days) <= 0) {
        throw new SDKError('days must be greater than 0', 'INVALID_PARAMETER');
    }

    const config = normalizeTransactionOptions(options);
    const tx = api.tx.storageHandler.otherReactivateTerritory(targetAcc, territoryName, days);

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

export async function territoryGrants(
    api: ApiPromise,
    keyring: KeyringPair,
    territoryName: string,
    receiver: AccountIdInput,
    options: TransactionOptions = {}
): Promise<TransactionResult> {
    if (!api?.tx?.storageHandler?.territoryGrants) {
        throw new SDKError(
            'storageHandler.territoryGrants method not available',
            'METHOD_NOT_AVAILABLE'
        );
    }

    if (!territoryName || !receiver) {
        throw new SDKError('territoryName is required', 'INVALID_PARAMETER');
    }

    const config = normalizeTransactionOptions(options);
    const tx = api.tx.storageHandler.territoryGrants(territoryName, receiver);

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

export async function territoryRename(
    api: ApiPromise,
    keyring: KeyringPair,
    oldName: string,
    newName: string,
    options: TransactionOptions = {}
): Promise<TransactionResult> {
    if (!api?.tx?.storageHandler?.territoryRename) {
        throw new SDKError(
            'storageHandler.territoryRename method not available',
            'METHOD_NOT_AVAILABLE'
        );
    }

    if (!oldName) {
        throw new SDKError('oldName is required', 'INVALID_PARAMETER');
    }

    if (!newName) {
        throw new SDKError('newName is required', 'INVALID_PARAMETER');
    }

    if (oldName === newName) {
        throw new SDKError('oldName and newName cannot be the same', 'INVALID_PARAMETER');
    }

    const config = normalizeTransactionOptions(options);
    const tx = api.tx.storageHandler.territoryRename(oldName, newName);

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

export async function updateExpiredExec(
    api: ApiPromise,
    keyring: KeyringPair,
    oldBlock: BlockNumberInput,
    newBlock: BlockNumberInput,
    token: Token,
    options: TransactionOptions = {}
): Promise<TransactionResult> {
    if (!api?.tx?.storageHandler?.updateExpiredExec) {
        throw new SDKError(
            'storageHandler.updateExpiredExec method not available',
            'METHOD_NOT_AVAILABLE'
        );
    }

    if (!oldBlock || !newBlock || newBlock <= oldBlock) {
        throw new SDKError('oldBlock is required and must less than newBlock', 'INVALID_PARAMETER');
    }

    if (!token) {
        throw new SDKError('token is required', 'INVALID_PARAMETER');
    }

    const config = normalizeTransactionOptions(options);
    const tx = api.tx.storageHandler.updateExpiredExec(oldBlock, newBlock, token);

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

export async function updatePrice(
    api: ApiPromise,
    keyring: KeyringPair,
    options: TransactionOptions = {}
): Promise<TransactionResult> {
    if (!api?.tx?.storageHandler?.updatePrice) {
        throw new SDKError(
            'storageHandler.updatePrice method not available',
            'METHOD_NOT_AVAILABLE'
        );
    }

    const config = normalizeTransactionOptions(options);
    const tx = api.tx.storageHandler.updatePrice();

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

export async function updateUserTerritoryLife(
    api: ApiPromise,
    keyring: KeyringPair,
    user: AccountIdInput,
    territoryName: string,
    deadline: BlockNumberInput,
    options: TransactionOptions = {}
): Promise<TransactionResult> {
    if (!api?.tx?.storageHandler?.updateUserTerritoryLife) {
        throw new SDKError(
            'storageHandler.updateUserTerritoryLife method not available',
            'METHOD_NOT_AVAILABLE'
        );
    }

    if (!user) {
        throw new SDKError('user is required', 'INVALID_PARAMETER');
    }

    if (!territoryName) {
        throw new SDKError('territoryName is required', 'INVALID_PARAMETER');
    }

    if (typeof deadline !== 'number' && !deadline) {
        throw new SDKError('deadline is required', 'INVALID_PARAMETER');
    }

    const config = normalizeTransactionOptions(options);
    const tx = api.tx.storageHandler.updateUserTerritoryLife(user, territoryName, deadline);

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


class StorageHandlerTypeConverter {
    /**
     * Convert raw storage order data to StorageHandlerOrder type
     */
    static convertToStorageHandlerOrder(orderData: any): StorageHandlerOrder {
        return {
            territoryName: hexToString(orderData.territoryName),
            pay: BigInt(orderData.pay),
            gibCount: Number(orderData.gibCount),
            days: Number(orderData.days),
            expired: Number(orderData.expired),
            targetAcc: orderData.targetAcc,
            orderType: orderData.orderType
        } as StorageHandlerOrder;
    }

    /**
     * Convert raw territory data to Territory type
     */
    static convertToTerritory(territoryData: any): Territory {
        return {
            token: territoryData.token,
            totalSpace: BigInt(territoryData.totalSpace),
            usedSpace: BigInt(territoryData.usedSpace),
            lockedSpace: BigInt(territoryData.lockedSpace),
            remainingSpace: BigInt(territoryData.remainingSpace),
            start: Number(territoryData.start),
            deadline: Number(territoryData.deadline),
            state: territoryData.state
        };
    }

    /**
     * Convert raw consignment data to Consignment type
     */
    static convertToConsignment(consignmentData: any): Consignment {
        return {
            user: consignmentData.user,
            price: BigInt(consignmentData.price),
            buyers: consignmentData.buyers || null,
            exec: consignmentData.exec !== null ? Number(consignmentData.exec) : null,
            locked: Boolean(consignmentData.locked)
        };
    }
}