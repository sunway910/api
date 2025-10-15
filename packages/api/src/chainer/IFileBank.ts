import {
    AccountIdInput, BlockNumberInput,
    FileMetadata, FileMetadataDetail, RestoralOrderInfo, RestoralOrderInfoDetail, SegmentList, SpaceProofInfo,
    StorageOrder, StorageOrderDetail, TagSigInfo, UserBrief, UserFileSliceDetail, UserFileSliceInfo
} from "@cessnetwork/types";
import { TransactionOptions, TransactionResult } from "@/utils/tx";

export interface IFileBank {
    queryDealMap(txHash?: string, block?: BlockNumberInput): Promise<StorageOrder | StorageOrderDetail[] | null>;
    queryFileByFid(fid?: string, block?: BlockNumberInput): Promise<FileMetadata | FileMetadataDetail[] | null>;
    queryRestoralOrder(fragmentHash?: string, block?: BlockNumberInput): Promise<RestoralOrderInfo | RestoralOrderInfoDetail[] | null>;
    queryTaskFailedCount(accountId: AccountIdInput, block?: BlockNumberInput): Promise<number>;
    queryUserHoldFileList(accountId?: AccountIdInput, block?: BlockNumberInput): Promise<UserFileSliceInfo[] | UserFileSliceDetail[]>;

    uploadDeclaration(hash: string, segment: SegmentList[], user: UserBrief, filesize: bigint, options?: TransactionOptions): Promise<TransactionResult>;
    deleteFile(owner: AccountIdInput, hash: string, options?: TransactionOptions): Promise<TransactionResult>;
    transferReport(index: number, hash: string, options?: TransactionOptions): Promise<TransactionResult>;
    generateRestoralOrder(hash: string, fragmentHash: string, options?: TransactionOptions): Promise<TransactionResult>;
    claimRestoralOrder(fragmentHash: string, options?: TransactionOptions): Promise<TransactionResult>;
    claimRestoralNoExistOrder(puk: Uint8Array, hash: string, fragmentHash: string, options?: TransactionOptions): Promise<TransactionResult>;
    restoralOrderComplete(fragmentHash: string, options?: TransactionOptions): Promise<TransactionResult>;
    certIdleSpace(spaceProofInfo: SpaceProofInfo, teeSignWithAcc: string, teeSign: string, teePuk: string, options?: TransactionOptions): Promise<TransactionResult>;
    replaceIdleSpace(spaceProofInfo: SpaceProofInfo, teeSignWithAcc: string, teeSign: string, teePuk: string, options?: TransactionOptions): Promise<TransactionResult>;
    calculateReport(teeSig: string, tagSigInfo: TagSigInfo, options?: TransactionOptions): Promise<TransactionResult>;
    territoryFileDelivery(user: AccountIdInput, hash: string, targetTerritory: string, options?: TransactionOptions): Promise<TransactionResult>;
}
