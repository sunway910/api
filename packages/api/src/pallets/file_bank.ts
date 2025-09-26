/*
 * Copyright (C) CESS. All rights reserved.
 * Copyright (C) Cumulus Encrypted Storage System. All rights reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import { SDKError } from "@/utils";
import { calculatePaymentInfo, executeTransaction, normalizeTransactionOptions, TransactionOptions, TransactionResult } from "@/utils/tx";
import { ApiPromise } from '@polkadot/api';
import { KeyringPair } from "@polkadot/keyring/types";
import {
    StorageOrder,
    FileMetadata,
    RestoralOrderInfo,
    UserFileSliceInfo,
    SegmentList,
    UserBrief,
    SpaceProofInfo,
    TagSigInfo,
    StorageOrderDetail,
    FileMetadataDetail,
    RestoralOrderInfoDetail,
    UserFileSliceDetail,
    SegmentInfo,
    FragmentInfo,
    CompleteInfo, TxHashInput, BlockNumberInput, AccountIdInput, CommonHash, TeeSig, TeeWorkerPublicKey
} from '@cessnetwork/types';
import { hexToString } from "@polkadot/util";

export async function queryDealMap(
    api: ApiPromise,
    txHash?: TxHashInput,
    block?: BlockNumberInput
): Promise<StorageOrder | StorageOrderDetail[] | null> {
    const option = block ? await api.at(await api.rpc.chain.getBlockHash(block)) : api;

    if (txHash) {
        const result = await option.query.fileBank.dealMap(txHash);
        if (result.isEmpty) {
            return null;
        }

        const orderData = result.toJSON() as any;
        return FileBankTypeConverter.convertToStorageOrder(orderData);
    } else {
        const result = await option.query.fileBank.dealMap.entries();
        return result.map(([key, value]) => {
            const orderData = value.toJSON() as any;
            return {
                hash: hexToString(key.args[0].toString()),
                storageOrder: FileBankTypeConverter.convertToStorageOrder(orderData)
            } as StorageOrderDetail;
        });
    }
}

export async function queryFileByFid(
    api: ApiPromise,
    fid?: CommonHash,
    block?: BlockNumberInput
): Promise<FileMetadata | FileMetadataDetail[] | null> {
    const option = block ? await api.at(await api.rpc.chain.getBlockHash(block)) : api;

    if (fid) {
        const result = await option.query.fileBank.file(fid);
        if (result.isEmpty) {
            return null;
        }
        const fileData = result.toJSON() as any;
        return FileBankTypeConverter.convertToFileMetadata(fileData);
    } else {
        const result = await option.query.fileBank.file.entries();
        return result.map(([key, value]) => {
            const fileData = value.toJSON() as any;
            return {
                fid: hexToString(key.args[0].toString()),
                fileMetadata: FileBankTypeConverter.convertToFileMetadata(fileData)
            } as FileMetadataDetail;
        });
    }
}

export async function queryRestoralOrderByFragmentHash(
    api: ApiPromise,
    fragmentHash?: CommonHash,
    block?: BlockNumberInput
): Promise<RestoralOrderInfo | RestoralOrderInfoDetail[] | null> {
    const option = block ? await api.at(await api.rpc.chain.getBlockHash(block)) : api;

    if (fragmentHash) {
        const result = await option.query.fileBank.restoralOrder(fragmentHash);
        if (result.isEmpty) {
            return null;
        }

        const orderData = result.toJSON() as any;
        return FileBankTypeConverter.convertToRestoralOrderInfo(orderData);
    } else {
        const result = await option.query.fileBank.restoralOrder.entries();
        return result.map(([key, value]) => {
            const orderData = value.toJSON() as any;
            return {
                fragmentHash: key.args[0].toString(),
                restoralOrderInfo: FileBankTypeConverter.convertToRestoralOrderInfo(orderData)
            } as RestoralOrderInfoDetail;
        });
    }
}

export async function queryTaskFailedCount(
    api: ApiPromise,
    accountId: AccountIdInput,
    block?: BlockNumberInput
): Promise<number> {
    const option = block ? await api.at(await api.rpc.chain.getBlockHash(block)) : api;
    const result = await option.query.fileBank.taskFailedCount(accountId);
    return Number(result.toString());
}

export async function queryUserHoldFileByAccountId(
    api: ApiPromise,
    accountId?: AccountIdInput,
    block?: BlockNumberInput
): Promise<UserFileSliceInfo[] | UserFileSliceDetail[]> {
    const option = block ? await api.at(await api.rpc.chain.getBlockHash(block)) : api;

    if (accountId) {
        const result = await option.query.fileBank.userHoldFileList(accountId);
        if (result.isEmpty) {
            return [];
        }
        const fileListData = result.toJSON() as any;
        return FileBankTypeConverter.convertToUserFileSliceInfoArray(fileListData);
    } else {
        const result = await option.query.fileBank.userHoldFileList.entries();
        return result.map(([key, value]) => {
            const fileListData = value.toJSON() as any;
            return {
                account: key.args[0].toString(),
                userFileSliceInfo: FileBankTypeConverter.convertToUserFileSliceInfoArray(fileListData)
            } as UserFileSliceDetail;
        });
    }
}

export async function uploadDeclaration(
    api: ApiPromise,
    keyring: KeyringPair,
    hash: CommonHash,
    segment: SegmentList[],
    user: UserBrief,
    filesize: bigint,
    options: TransactionOptions = {}
): Promise<TransactionResult> {
    if (!api?.tx?.fileBank?.uploadDeclaration) {
        throw new SDKError(
            'fileBank.uploadDeclaration method not available',
            'METHOD_NOT_AVAILABLE'
        );
    }

    const config = normalizeTransactionOptions(options);

    const tx = api.tx.fileBank.uploadDeclaration(hash, segment, user, filesize);

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

export async function deleteFile(
    api: ApiPromise,
    keyring: KeyringPair,
    owner: AccountIdInput,
    hash: CommonHash,
    options: TransactionOptions = {}
): Promise<TransactionResult> {
    if (!api?.tx?.fileBank?.deleteFile) {
        throw new SDKError(
            'fileBank.deleteFile method not available',
            'METHOD_NOT_AVAILABLE'
        );
    }

    const config = normalizeTransactionOptions(options);

    const tx = api.tx.fileBank.deleteFile(owner, hash);

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

export async function transferReport(
    api: ApiPromise,
    keyring: KeyringPair,
    index: number,
    hash: CommonHash,
    options: TransactionOptions = {}
): Promise<TransactionResult> {
    if (!api?.tx?.fileBank?.transferReport) {
        throw new SDKError(
            'fileBank.transferReport method not available',
            'METHOD_NOT_AVAILABLE'
        );
    }

    const config = normalizeTransactionOptions(options);

    const tx = api.tx.fileBank.transferReport(index, hash);

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

export async function generateRestoralOrder(
    api: ApiPromise,
    keyring: KeyringPair,
    hash: CommonHash,
    fragmentHash: CommonHash,
    options: TransactionOptions = {}
): Promise<TransactionResult> {
    if (!api?.tx?.fileBank?.generateRestoralOrder) {
        throw new SDKError(
            'fileBank.generateRestoralOrder method not available',
            'METHOD_NOT_AVAILABLE'
        );
    }

    const config = normalizeTransactionOptions(options);

    const tx = api.tx.fileBank.generateRestoralOrder(hash, fragmentHash);

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

export async function claimRestoralOrder(
    api: ApiPromise,
    keyring: KeyringPair,
    fragmentHash: CommonHash,
    options: TransactionOptions = {}
): Promise<TransactionResult> {
    if (!api?.tx?.fileBank?.claimRestoralOrder) {
        throw new SDKError(
            'fileBank.claimRestoralOrder method not available',
            'METHOD_NOT_AVAILABLE'
        );
    }

    const config = normalizeTransactionOptions(options);

    const tx = api.tx.fileBank.claimRestoralOrder(fragmentHash);

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

export async function claimRestoralNoExistOrder(
    api: ApiPromise,
    keyring: KeyringPair,
    accountId: AccountIdInput,
    hash: CommonHash,
    fragmentHash: CommonHash,
    options: TransactionOptions = {}
): Promise<TransactionResult> {
    if (!api?.tx?.fileBank?.claimRestoralNoexistOrder) {
        throw new SDKError(
            'fileBank.claimRestoralNoexistOrder method not available',
            'METHOD_NOT_AVAILABLE'
        );
    }

    const config = normalizeTransactionOptions(options);

    const tx = api.tx.fileBank.claimRestoralNoexistOrder(accountId, hash, fragmentHash);

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

export async function restoralOrderComplete(
    api: ApiPromise,
    keyring: KeyringPair,
    fragmentHash: CommonHash,
    options: TransactionOptions = {}
): Promise<TransactionResult> {
    if (!api?.tx?.fileBank?.restoralOrderComplete) {
        throw new SDKError(
            'fileBank.restoralOrderComplete method not available',
            'METHOD_NOT_AVAILABLE'
        );
    }

    const config = normalizeTransactionOptions(options);

    const tx = api.tx.fileBank.restoralOrderComplete(fragmentHash);

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

export async function certIdleSpace(
    api: ApiPromise,
    keyring: KeyringPair,
    spaceProofInfo: SpaceProofInfo,
    teeSignWithAcc: TeeSig,
    teeSign: TeeSig,
    teePuk: TeeWorkerPublicKey,
    options: TransactionOptions = {}
): Promise<TransactionResult> {
    if (!api?.tx?.fileBank?.certIdleSpace) {
        throw new SDKError(
            'fileBank.certIdleSpace method not available',
            'METHOD_NOT_AVAILABLE'
        );
    }

    const config = normalizeTransactionOptions(options);

    const tx = api.tx.fileBank.certIdleSpace(spaceProofInfo, teeSignWithAcc, teeSign, teePuk);

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

export async function replaceIdleSpace(
    api: ApiPromise,
    keyring: KeyringPair,
    spaceProofInfo: SpaceProofInfo,
    teeSignWithAcc: TeeSig,
    teeSign: TeeSig,
    teePuk: TeeWorkerPublicKey,
    options: TransactionOptions = {}
): Promise<TransactionResult> {
    if (!api?.tx?.fileBank?.replaceIdleSpace) {
        throw new SDKError(
            'fileBank.replaceIdleSpace method not available',
            'METHOD_NOT_AVAILABLE'
        );
    }

    const config = normalizeTransactionOptions(options);

    const tx = api.tx.fileBank.replaceIdleSpace(spaceProofInfo, teeSignWithAcc, teeSign, teePuk);

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

export async function calculateReport(
    api: ApiPromise,
    keyring: KeyringPair,
    teeSig: TeeSig,
    tagSigInfo: TagSigInfo,
    options: TransactionOptions = {}
): Promise<TransactionResult> {
    if (!api?.tx?.fileBank?.calculateReport) {
        throw new SDKError(
            'fileBank.calculateReport method not available',
            'METHOD_NOT_AVAILABLE'
        );
    }

    const config = normalizeTransactionOptions(options);

    const tx = api.tx.fileBank.calculateReport(teeSig, tagSigInfo);

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

export async function territoryFileDelivery(
    api: ApiPromise,
    keyring: KeyringPair,
    user: AccountIdInput,
    hash: CommonHash,
    targetTerritoryName: string,
    options: TransactionOptions = {}
): Promise<TransactionResult> {
    if (!api?.tx?.fileBank?.territoryFileDelivery) {
        throw new SDKError(
            'fileBank.territoryFileDelivery method not available',
            'METHOD_NOT_AVAILABLE'
        );
    }

    const config = normalizeTransactionOptions(options);

    const tx = api.tx.fileBank.territoryFileDelivery(user, hash, targetTerritoryName);

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

class FileBankTypeConverter {
    /**
     * Convert raw storage order data to StorageOrder type
     */
    static convertToStorageOrder(orderData: any): StorageOrder {
        return {
            fileSize: orderData.fileSize ? BigInt(orderData.fileSize) : 0n,
            segmentList: Array.isArray(orderData.segmentList) ?
                orderData.segmentList.map((segment: any) => ({
                    hash: hexToString(segment.hash),
                    fragmentList: Array.isArray(segment.fragmentList) ?
                        segment.fragmentList.map((hash: any) => hexToString(hash.toString())) : []
                } as SegmentList)) : [],
            user: {
                user: orderData.user?.user || '',
                fileName: hexToString(orderData.user?.fileName) || '',
                territoryName: hexToString(orderData.user?.territoryName) || ''
            } as UserBrief,
            completeList: Array.isArray(orderData.completeList) ?
                orderData.completeList.map((complete: any) => ({
                    index: Number(complete.index),
                    miner: complete.miner
                } as CompleteInfo)) : []
        };
    }

    /**
     * Convert raw file metadata to FileMetadata type
     */
    static convertToFileMetadata(fileData: any): FileMetadata {
        return {
            segmentList: Array.isArray(fileData.segmentList) ?
                fileData.segmentList.map((segment: any) => ({
                    hash: hexToString(segment.hash),
                    fragmentList: Array.isArray(segment.fragmentList) ?
                        segment.fragmentList.map((fragment: any) => ({
                            hash: hexToString(fragment.hash),
                            avail: Boolean(fragment.avail),
                            tag: fragment.tag !== null ? Number(fragment.tag) : null,
                            miner: fragment.miner
                        } as FragmentInfo)) : []
                } as SegmentInfo)) : [],
            owner: Array.isArray(fileData.owner) ?
                fileData.owner.map((user: any) => ({
                    user: user.user,
                    fileName: hexToString(user.fileName),
                    territoryName: hexToString(user.territoryName)
                } as UserBrief)) : [],
            fileSize: BigInt(fileData.fileSize || 0),
            completion: Number(fileData.completion || 0),
            state: Number(fileData.state || 0)
        };
    }

    /**
     * Convert raw restoral order data to RestoralOrderInfo type
     */
    static convertToRestoralOrderInfo(orderData: any): RestoralOrderInfo {
        return {
            count: Number(orderData.count || 0),
            miner: orderData.miner,
            originMiner: orderData.originMiner,
            fragmentHash: orderData.fragmentHash,
            fileHash: orderData.fileHash,
            genBlock: Number(orderData.genBlock || 0),
            deadline: Number(orderData.deadline || 0)
        };
    }

    /**
     * Convert single file slice data to UserFileSliceInfo
     */
    static convertToUserFileSliceInfo(fileSlice: any): UserFileSliceInfo {
        return {
            territoryName: hexToString(fileSlice.territoryName),
            fileHash: hexToString(fileSlice.fileHash),
            fileSize: BigInt(fileSlice.fileSize)
        };
    }

    /**
     * Convert array of file slice data to UserFileSliceInfo array
     */
    static convertToUserFileSliceInfoArray(fileListData: any): UserFileSliceInfo[] {
        if (!Array.isArray(fileListData)) {
            return [];
        }
        return fileListData.map((fileSlice: any) =>
            this.convertToUserFileSliceInfo(fileSlice)
        );
    }
}