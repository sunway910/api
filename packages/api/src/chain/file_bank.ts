import {
    AccountIdInput, BlockNumberInput,
    FileMetadata,
    FileMetadataDetail,
    RestoralOrderInfo,
    RestoralOrderInfoDetail,
    SegmentList,
    SpaceProofInfo,
    StorageOrder,
    StorageOrderDetail,
    TagSigInfo,
    UserBrief,
    UserFileSliceDetail,
    UserFileSliceInfo
} from '@cessnetwork/types';
import { TransactionOptions, TransactionResult } from "@/utils/tx";
import { isApiReady, isKeyringReady } from "@/utils/tx";
import { SDKError } from "@/utils";
import * as fileBank from '@/pallets/file_bank';
import type { Constructor } from "./types";
import { ChainBase } from "./types";

export function FileBank<TBase extends Constructor<ChainBase>>(Base: TBase) {
    return class extends Base {
        async queryDealMap(txHash?: string, block?: BlockNumberInput): Promise<StorageOrder | StorageOrderDetail[] | null> {
            if (!isApiReady(this.api)) {
                throw new SDKError('API Client is not ready', 'INVALID_API_CLIENT');
            }
            return fileBank.queryDealMap(this.api, txHash, block);
        }

        async queryFileByFid(fid?: string, block?: BlockNumberInput): Promise<FileMetadata | FileMetadataDetail[] | null> {
            if (!isApiReady(this.api)) {
                throw new SDKError('API Client is not ready', 'INVALID_API_CLIENT');
            }
            return fileBank.queryFileByFid(this.api, fid, block);
        }

        async queryRestoralOrder(fragmentHash?: string, block?: BlockNumberInput): Promise<RestoralOrderInfo | RestoralOrderInfoDetail[] | null> {
            if (!isApiReady(this.api)) {
                throw new SDKError('API Client is not ready', 'INVALID_API_CLIENT');
            }
            return fileBank.queryRestoralOrderByFragmentHash(this.api, fragmentHash, block);
        }

        async queryTaskFailedCount(accountId: AccountIdInput, block?: BlockNumberInput): Promise<number> {
            if (!isApiReady(this.api)) {
                throw new SDKError('API Client is not ready', 'INVALID_API_CLIENT');
            }
            return fileBank.queryTaskFailedCount(this.api, accountId, block);
        }

        async queryUserHoldFileList(accountId?: AccountIdInput, block?: BlockNumberInput): Promise<UserFileSliceInfo[] | UserFileSliceDetail[]> {
            if (!isApiReady(this.api)) {
                throw new SDKError('API Client is not ready', 'INVALID_API_CLIENT');
            }
            return fileBank.queryUserHoldFileByAccountId(this.api, accountId, block);
        }

        uploadDeclaration(hash: string, segment: SegmentList[], user: UserBrief, filesize: bigint, options?: TransactionOptions): Promise<TransactionResult> {
            if (!isApiReady(this.api)) {
                throw new SDKError('API Client is not ready', 'INVALID_API_CLIENT');
            }
            if (!isKeyringReady(this.keyring)) {
                throw new SDKError('Keyring Pair is required', 'INVALID_KEYRING');
            }
            return fileBank.uploadDeclaration(this.api, this.keyring, hash, segment, user, filesize, options);
        }

        deleteFile(owner: AccountIdInput, hash: string, options?: TransactionOptions): Promise<TransactionResult> {
            if (!isApiReady(this.api)) {
                throw new SDKError('API Client is not ready', 'INVALID_API_CLIENT');
            }
            if (!isKeyringReady(this.keyring)) {
                throw new SDKError('Keyring Pair is required', 'INVALID_KEYRING');
            }
            return fileBank.deleteFile(this.api, this.keyring, owner, hash, options);
        }

        transferReport(index: number, hash: string, options?: TransactionOptions): Promise<TransactionResult> {
            if (!isApiReady(this.api)) {
                throw new SDKError('API Client is not ready', 'INVALID_API_CLIENT');
            }
            if (!isKeyringReady(this.keyring)) {
                throw new SDKError('Keyring Pair is required', 'INVALID_KEYRING');
            }
            return fileBank.transferReport(this.api, this.keyring, index, hash, options);
        }

        generateRestoralOrder(hash: string, fragmentHash: string, options?: TransactionOptions): Promise<TransactionResult> {
            if (!isApiReady(this.api)) {
                throw new SDKError('API Client is not ready', 'INVALID_API_CLIENT');
            }
            if (!isKeyringReady(this.keyring)) {
                throw new SDKError('Keyring Pair is required', 'INVALID_KEYRING');
            }
            return fileBank.generateRestoralOrder(this.api, this.keyring, hash, fragmentHash, options);
        }

        claimRestoralOrder(fragmentHash: string, options?: TransactionOptions): Promise<TransactionResult> {
            if (!isApiReady(this.api)) {
                throw new SDKError('API Client is not ready', 'INVALID_API_CLIENT');
            }
            if (!isKeyringReady(this.keyring)) {
                throw new SDKError('Keyring Pair is required', 'INVALID_KEYRING');
            }
            return fileBank.claimRestoralOrder(this.api, this.keyring, fragmentHash, options);
        }

        claimRestoralNoExistOrder(puk: Uint8Array, hash: string, fragmentHash: string, options?: TransactionOptions): Promise<TransactionResult> {
            if (!isApiReady(this.api)) {
                throw new SDKError('API Client is not ready', 'INVALID_API_CLIENT');
            }
            if (!isKeyringReady(this.keyring)) {
                throw new SDKError('Keyring Pair is required', 'INVALID_KEYRING');
            }
            return fileBank.claimRestoralNoExistOrder(this.api, this.keyring, puk, hash, fragmentHash, options);
        }

        restoralOrderComplete(fragmentHash: string, options?: TransactionOptions): Promise<TransactionResult> {
            if (!isApiReady(this.api)) {
                throw new SDKError('API Client is not ready', 'INVALID_API_CLIENT');
            }
            if (!isKeyringReady(this.keyring)) {
                throw new SDKError('Keyring Pair is required', 'INVALID_KEYRING');
            }
            return fileBank.restoralOrderComplete(this.api, this.keyring, fragmentHash, options);
        }

        certIdleSpace(spaceProofInfo: SpaceProofInfo, teeSignWithAcc: string, teeSign: string, teePuk: string, options?: TransactionOptions): Promise<TransactionResult> {
            if (!isApiReady(this.api)) {
                throw new SDKError('API Client is not ready', 'INVALID_API_CLIENT');
            }
            if (!isKeyringReady(this.keyring)) {
                throw new SDKError('Keyring Pair is required', 'INVALID_KEYRING');
            }
            return fileBank.certIdleSpace(this.api, this.keyring, spaceProofInfo, teeSignWithAcc, teeSign, teePuk, options);
        }

        replaceIdleSpace(spaceProofInfo: SpaceProofInfo, teeSignWithAcc: string, teeSign: string, teePuk: string, options?: TransactionOptions): Promise<TransactionResult> {
            if (!isApiReady(this.api)) {
                throw new SDKError('API Client is not ready', 'INVALID_API_CLIENT');
            }
            if (!isKeyringReady(this.keyring)) {
                throw new SDKError('Keyring Pair is required', 'INVALID_KEYRING');
            }
            return fileBank.replaceIdleSpace(this.api, this.keyring, spaceProofInfo, teeSignWithAcc, teeSign, teePuk, options);
        }

        calculateReport(teeSig: string, tagSigInfo: TagSigInfo, options?: TransactionOptions): Promise<TransactionResult> {
            if (!isApiReady(this.api)) {
                throw new SDKError('API Client is not ready', 'INVALID_API_CLIENT');
            }
            if (!isKeyringReady(this.keyring)) {
                throw new SDKError('Keyring Pair is required', 'INVALID_KEYRING');
            }
            return fileBank.calculateReport(this.api, this.keyring, teeSig, tagSigInfo, options);
        }

        territoryFileDelivery(user: Uint8Array, hash: string, targetTerritory: string, options?: TransactionOptions): Promise<TransactionResult> {
            if (!isApiReady(this.api)) {
                throw new SDKError('API Client is not ready', 'INVALID_API_CLIENT');
            }
            if (!isKeyringReady(this.keyring)) {
                throw new SDKError('Keyring Pair is required', 'INVALID_KEYRING');
            }
            return fileBank.territoryFileDelivery(this.api, this.keyring, user, hash, targetTerritory, options);
        }
    }
}