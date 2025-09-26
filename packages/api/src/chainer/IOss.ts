import { AccountIdInput, BlockNumberInput, EIP712Signature, OssAuthorityList, OssDetail, OssInfo, OssProxyAuthPayload } from "@cessnetwork/types";
import { TransactionOptions, TransactionResult } from "@/utils/tx";

export interface IOss {
    queryOssByAccountId(accountId?: AccountIdInput, block?: BlockNumberInput): Promise<OssInfo | OssDetail[] | null>;
    queryAuthorityListByAccountId(accountId?: AccountIdInput, block?: BlockNumberInput): Promise<string[] | OssAuthorityList[]>;

    authorize(accountId: AccountIdInput, options?: TransactionOptions): Promise<TransactionResult>;
    proxyAuthorize(authPub: AccountIdInput, sig: Uint8Array | EIP712Signature | string, payload: OssProxyAuthPayload, options?: TransactionOptions): Promise<TransactionResult>;
    cancelOssAuthorize(accountId: AccountIdInput, options?: TransactionOptions): Promise<TransactionResult>;
    registerOssNode(domain: string, options?: TransactionOptions): Promise<TransactionResult>;
    updateOssEndpoint(domain: string, options?: TransactionOptions): Promise<TransactionResult>;
    destroyOss(options?: TransactionOptions): Promise<TransactionResult>;
}
