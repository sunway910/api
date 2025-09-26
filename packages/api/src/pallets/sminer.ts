/*
 * Copyright (C) CESS. All rights reserved.
 * Copyright (C) Cumulus Encrypted Storage System. All rights reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import { SDKError } from "@/utils";
import { calculatePaymentInfo, executeTransaction, normalizeTransactionOptions, TransactionOptions, TransactionResult } from "@/utils/tx";
import { ApiPromise } from '@polkadot/api';
import {
    ExpanderInfo,
    MinerInfo,
    MinerReward,
    RestoralTargetInfo,
    CompleteSnapShotType,
    MinerCompleteInfo,
    PoISKeyInfo,
    MinerInfoDetail,
    MinerStakingStartBlock,
    MinerRewardDetail,
    RestoralTargetInfoDetail,
    PendingReplacement,
    MinerCompleteDetail,
    RewardOrder, BlockNumberInput, AccountIdInput, EraInput, Token, Space, TeeSig, TeeWorkerPublicKey, BalanceInput,
} from '@cessnetwork/types';
import { KeyringPair } from "@polkadot/keyring/types";
import { AccountId } from '@polkadot/types/interfaces';
import { hexToString } from "@polkadot/util";

export async function queryExpanders(
    api: ApiPromise,
    block?: BlockNumberInput
): Promise<ExpanderInfo | null> {
    const option = block ? await api.at(await api.rpc.chain.getBlockHash(block)) : api;
    const result = await option.query.sminer.expenders();

    if (result.isEmpty) {
        return null;
    }

    const expanderData = result.toJSON() as any;
    return SminerTypeConverter.convertToExpanderInfo(expanderData);
}

export async function queryMinerByAccountId(
    api: ApiPromise,
    accountId?: AccountIdInput,
    block?: BlockNumberInput
): Promise<MinerInfo | MinerInfoDetail[] | null> {
    const option = block ? await api.at(await api.rpc.chain.getBlockHash(block)) : api;

    if (accountId) {
        const result = await option.query.sminer.minerItems(accountId);

        if (result.isEmpty) {
            return null;
        }

        const minerData = result.toJSON() as any;
        return SminerTypeConverter.convertToMinerInfo(minerData);
    } else {
        const result = await option.query.sminer.minerItems.entries();
        return result.map(([key, value]) => {
            const minerData = value.toJSON() as any;
            return {
                account: key.args[0].toString(),
                minerInfo: SminerTypeConverter.convertToMinerInfo(minerData)
            } as MinerInfoDetail;
        });
    }
}

export async function queryStakingStartBlock(
    api: ApiPromise,
    accountId?: AccountIdInput,
    block?: BlockNumberInput
): Promise<number | MinerStakingStartBlock[]> {
    const option = block ? await api.at(await api.rpc.chain.getBlockHash(block)) : api;

    if (accountId) {
        const result = await option.query.sminer.stakingStartBlock(accountId);

        if (result.isEmpty) {
            return 0;
        }

        return Number(result.toString());
    } else {
        const result = await option.query.sminer.stakingStartBlock.entries();
        return result.map(([key, value]) => {
            return {
                account: key.args[0].toString(),
                blockNumber: Number(value.toString())
            } as MinerStakingStartBlock;
        });
    }
}

export async function queryAllMinerAddress(
    api: ApiPromise,
    block?: BlockNumberInput
): Promise<AccountId[]> {
    const option = block ? await api.at(await api.rpc.chain.getBlockHash(block)) : api;
    const result = await option.query.sminer.allMiner();

    if (result.isEmpty) {
        return [];
    }

    return result.toJSON() as unknown as AccountId[];
}

export async function queryTotalNumberOfStorageMiner(
    api: ApiPromise,
    block?: BlockNumberInput
): Promise<number> {
    const option = block ? await api.at(await api.rpc.chain.getBlockHash(block)) : api;
    const result = await option.query.sminer.counterForMinerItems();

    if (result.isEmpty) {
        return 0;
    }

    return Number(result.toString());
}

export async function queryRewardMapByAccountId(
    api: ApiPromise,
    accountId?: AccountIdInput,
    block?: BlockNumberInput
): Promise<MinerReward | MinerRewardDetail[] | null> {
    const option = block ? await api.at(await api.rpc.chain.getBlockHash(block)) : api;

    if (accountId) {
        const result = await option.query.sminer.rewardMap(accountId);

        if (result.isEmpty) {
            return null;
        }

        const rewardData = result.toJSON() as any;
        return SminerTypeConverter.convertToMinerReward(rewardData);
    } else {
        const result = await option.query.sminer.rewardMap.entries();
        return result.map(([key, value]) => {
            const rewardData = value.toJSON() as any;
            return {
                account: key.args[0].toString(),
                minerReward: SminerTypeConverter.convertToMinerReward(rewardData)
            } as MinerRewardDetail;
        });
    }
}

export async function queryMinerLockByAccountId(
    api: ApiPromise,
    accountId: AccountIdInput,
    block?: BlockNumberInput
): Promise<any | null> {
    const option = block ? await api.at(await api.rpc.chain.getBlockHash(block)) : api;
    const result = await option.query.sminer.minerLock(accountId);

    if (result.isEmpty) {
        return null;
    }

    return result.toJSON();
}

export async function queryRestoralTargetByAccountId(
    api: ApiPromise,
    accountId?: AccountIdInput,
    block?: BlockNumberInput
): Promise<RestoralTargetInfo | RestoralTargetInfoDetail[] | null> {
    const option = block ? await api.at(await api.rpc.chain.getBlockHash(block)) : api;

    if (accountId) {
        const result = await option.query.sminer.restoralTarget(accountId);

        if (result.isEmpty) {
            return null;
        }

        const targetData = result.toJSON() as any;
        return SminerTypeConverter.convertToRestoralTargetInfo(targetData);
    } else {
        const result = await option.query.sminer.restoralTarget.entries();
        return result.map(([key, value]) => {
            const targetData = value.toJSON() as any;
            return {
                accountId: key.args[0].toString(),
                restoralTargetInfo: SminerTypeConverter.convertToRestoralTargetInfo(targetData)
            } as RestoralTargetInfoDetail;
        });
    }
}

export async function queryPendingReplacements(
    api: ApiPromise,
    accountId?: AccountIdInput,
    block?: BlockNumberInput
): Promise<number | PendingReplacement[] | null> {
    const option = block ? await api.at(await api.rpc.chain.getBlockHash(block)) : api;

    if (accountId) {
        const result = await option.query.sminer.pendingReplacements(accountId);

        if (result.isEmpty) {
            return null;
        }

        return Number(result.toString());
    } else {
        const result = await option.query.sminer.pendingReplacements.entries();
        return result.map(([key, value]) => {
            return {
                account: key.args[0].toString(),
                value: Number(value.toString())
            } as PendingReplacement;
        });
    }
}

export async function queryCompleteSnapShotByEraNumber(
    api: ApiPromise,
    era: EraInput,
    block?: BlockNumberInput
): Promise<CompleteSnapShotType | null> {
    const option = block ? await api.at(await api.rpc.chain.getBlockHash(block)) : api;
    const result = await option.query.sminer.completeSnapShot(era);

    if (result.isEmpty) {
        return null;
    }

    const targetData = result.toJSON() as any;
    return SminerTypeConverter.convertToCompleteSnapShotType(targetData);
}

export async function queryCompleteMinerSnapShotByAccountId(
    api: ApiPromise,
    accountId?: AccountIdInput,
    block?: BlockNumberInput
): Promise<MinerCompleteInfo[] | MinerCompleteDetail[]> {
    const option = block ? await api.at(await api.rpc.chain.getBlockHash(block)) : api;

    if (accountId) {
        const result = await option.query.sminer.completeMinerSnapShot(accountId);

        if (result.isEmpty) {
            return [];
        }

        return result.toJSON() as unknown as MinerCompleteInfo[];
    } else {
        const result = await option.query.sminer.completeMinerSnapShot.entries();
        return result.map(([key, value]) => {
            return {
                account: key.args[0].toString(),
                minerCompleteInfo: value.toJSON() as unknown as MinerCompleteInfo
            } as MinerCompleteDetail;
        });
    }
}

export async function increaseCollateral(
    api: ApiPromise,
    keyring: KeyringPair,
    account: AccountIdInput,
    token: Token,
    options: TransactionOptions = {}
): Promise<TransactionResult> {
    if (!api?.tx?.sminer?.increaseCollateral) {
        throw new SDKError(
            'sminer.increaseCollateral method not available',
            'METHOD_NOT_AVAILABLE'
        );
    }
    const config = normalizeTransactionOptions(options);

    const tx = api.tx.sminer.increaseCollateral(account, token);

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

export async function increaseDeclarationSpace(
    api: ApiPromise,
    keyring: KeyringPair,
    tibCount: Space,
    options: TransactionOptions = {}
): Promise<TransactionResult> {
    if (!api?.tx?.sminer?.increaseDeclarationSpace) {
        throw new SDKError(
            'sminer.increaseDeclarationSpace method not available',
            'METHOD_NOT_AVAILABLE'
        );
    }

    const config = normalizeTransactionOptions(options);

    const tx = api.tx.sminer.increaseDeclarationSpace(tibCount);

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

export async function minerExitPrep(
    api: ApiPromise,
    keyring: KeyringPair,
    options: TransactionOptions = {}
): Promise<TransactionResult> {
    if (!api?.tx?.sminer?.minerExitPrep) {
        throw new SDKError(
            'sminer.minerExitPrep method not available',
            'METHOD_NOT_AVAILABLE'
        );
    }

    const config = normalizeTransactionOptions(options);

    const tx = api.tx.sminer.minerExitPrep();

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

export async function minerWithdraw(
    api: ApiPromise,
    keyring: KeyringPair,
    options: TransactionOptions = {}
): Promise<TransactionResult> {
    if (!api?.tx?.sminer?.minerWithdraw) {
        throw new SDKError(
            'sminer.minerWithdraw method not available',
            'METHOD_NOT_AVAILABLE'
        );
    }

    const config = normalizeTransactionOptions(options);

    const tx = api.tx.sminer.minerWithdraw();

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

export async function receiveReward(
    api: ApiPromise,
    keyring: KeyringPair,
    options: TransactionOptions = {}
): Promise<TransactionResult> {
    if (!api?.tx?.sminer?.receiveReward) {
        throw new SDKError(
            'sminer.receiveReward method not available',
            'METHOD_NOT_AVAILABLE'
        );
    }

    const config = normalizeTransactionOptions(options);

    const tx = api.tx.sminer.receiveReward();

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

export async function registerPoisKey(
    api: ApiPromise,
    keyring: KeyringPair,
    poisKey: PoISKeyInfo,
    teeSignWithAcc: TeeSig,
    teeSign: TeeSig,
    teePuk: TeeWorkerPublicKey,
    options: TransactionOptions = {}
): Promise<TransactionResult> {
    if (!api?.tx?.sminer?.registerPoisKey) {
        throw new SDKError(
            'sminer.registerPoisKey method not available',
            'METHOD_NOT_AVAILABLE'
        );
    }

    const config = normalizeTransactionOptions(options);

    const tx = api.tx.sminer.registerPoisKey(poisKey, teeSignWithAcc, teeSign, teePuk);

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

export async function regnstkSminer(
    api: ApiPromise,
    keyring: KeyringPair,
    earningAcc: AccountIdInput,
    endpoint: string,
    staking: BalanceInput,
    tibCount: Space,
    options: TransactionOptions = {}
): Promise<TransactionResult> {
    if (!api?.tx?.sminer?.regnstk) {
        throw new SDKError(
            'sminer.regnstk method not available',
            'METHOD_NOT_AVAILABLE'
        );
    }

    const config = normalizeTransactionOptions(options);

    const tx = api.tx.sminer.regnstk(earningAcc, endpoint, staking, tibCount);

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

export async function regnstkAssignStaking(
    api: ApiPromise,
    keyring: KeyringPair,
    earningAcc: AccountIdInput,
    endpoint: string,
    stakingAcc: AccountIdInput,
    tibCount: Space,
    options: TransactionOptions = {}
): Promise<TransactionResult> {
    if (!api?.tx?.sminer?.regnstkAssignStaking) {
        throw new SDKError(
            'sminer.regnstkAssignStaking method not available',
            'METHOD_NOT_AVAILABLE'
        );
    }

    const config = normalizeTransactionOptions(options);

    const tx = api.tx.sminer.regnstkAssignStaking(earningAcc, endpoint, stakingAcc, tibCount);

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

export async function updateBeneficiary(
    api: ApiPromise,
    keyring: KeyringPair,
    earningAcc: AccountIdInput,
    options: TransactionOptions = {}
): Promise<TransactionResult> {
    if (!api?.tx?.sminer?.updateBeneficiary) {
        throw new SDKError(
            'sminer.updateBeneficiary method not available',
            'METHOD_NOT_AVAILABLE'
        );
    }

    const config = normalizeTransactionOptions(options);

    const tx = api.tx.sminer.updateBeneficiary(earningAcc);

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

export async function updateSminerEndpoint(
    api: ApiPromise,
    keyring: KeyringPair,
    endpoint: string,
    options: TransactionOptions = {}
): Promise<TransactionResult> {
    if (!api?.tx?.sminer?.updateEndpoint) {
        throw new SDKError(
            'sminer.updateEndpoint method not available',
            'METHOD_NOT_AVAILABLE'
        );
    }

    const config = normalizeTransactionOptions(options);

    const tx = api.tx.sminer.updateEndpoint(endpoint);

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

export class SminerTypeConverter {
    /**
     * Convert raw miner data to MinerInfo type
     */
    static convertToMinerInfo(minerData: any): MinerInfo {
        return {
            beneficiary: minerData.beneficiary,
            stakingAccount: minerData.stakingAccount,
            endpoint: hexToString(minerData.endpoint),
            collaterals: BigInt(minerData.collaterals),
            debt: BigInt(minerData.debt),
            state: hexToString(minerData.state),
            declarationSpace: BigInt(minerData.declarationSpace),
            idleSpace: BigInt(minerData.idleSpace),
            serviceSpace: BigInt(minerData.serviceSpace),
            lockSpace: BigInt(minerData.lockSpace),
            spaceProofInfo: minerData.spaceProofInfo,
            serviceBloomFilter: minerData.serviceBloomFilter,
            teeSignature: minerData.teeSignature
        };
    }

    /**
     * Convert raw reward data to MinerReward type
     */
    static convertToMinerReward(rewardData: any): MinerReward {
        return {
            totalReward: BigInt(rewardData.totalReward),
            rewardIssued: BigInt(rewardData.rewardIssued),
            orderList: rewardData.orderList.map((order: any) => ({
                receiveCount: Number(order.receiveCount),
                maxCount: Number(order.maxCount),
                atonce: Boolean(order.atonce),
                orderReward: BigInt(order.orderReward),
                eachAmount: BigInt(order.eachAmount),
                lastReceiveBlock: Number(order.lastReceiveBlock)
            } as RewardOrder))
        };
    }

    /**
     * Convert raw restoral target data to RestoralTargetInfo type
     */
    static convertToRestoralTargetInfo(targetData: any): RestoralTargetInfo {
        return {
            miner: targetData.miner,
            serviceSpace: BigInt(targetData.serviceSpace),
            restoredSpace: BigInt(targetData.restoredSpace),
            coolingBlock: Number(targetData.coolingBlock)
        };
    }

    /**
     * Convert raw expander data to ExpanderInfo type
     */
    static convertToExpanderInfo(expanderData: any): ExpanderInfo {
        return {
            k: Number(expanderData[0]),
            n: Number(expanderData[1]),
            d: Number(expanderData[2])
        };
    }

    /**
     * Convert raw snapshot data to CompleteSnapShotType
     */
    static convertToCompleteSnapShotType(targetData: any): CompleteSnapShotType {
        return {
            minerCount: Number(targetData.minerCount),
            totalPower: Number(targetData.totalPower)
        };
    }
}
