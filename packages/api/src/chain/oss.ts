import {
    OssAuthorityList,
    OssDetail,
    OssInfo,
    OssProxyAuthPayload, AccountIdInput, BlockNumberInput, ProxySig
} from '@cessnetwork/types';
import { TransactionOptions, TransactionResult } from "@/utils/tx";
import { isApiReady, isKeyringReady } from "@/utils/tx";
import { SDKError } from "@/utils";
import * as oss from '@/pallets/oss';
import type { Constructor } from "./types";
import { ChainBase } from "./types";

export function Oss<TBase extends Constructor<ChainBase>>(Base: TBase) {
    return class extends Base {
        async queryOssByAccountId(accountId?: AccountIdInput, block?: BlockNumberInput): Promise<OssInfo | OssDetail[] | null> {
            if (!isApiReady(this.api)) {
                throw new SDKError('API Client is not ready', 'INVALID_API_CLIENT');
            }
            return oss.queryOssByAccountId(this.api, accountId, block);
        }

        async queryAuthorityListByAccountId(accountId?: AccountIdInput, block?: BlockNumberInput): Promise<string[] | OssAuthorityList[]> {
            if (!isApiReady(this.api)) {
                throw new SDKError('API Client is not ready', 'INVALID_API_CLIENT');
            }
            return oss.queryAuthorityListByAccountId(this.api, accountId, block);
        }

        authorize(accountId: AccountIdInput, options?: TransactionOptions): Promise<TransactionResult> {
            if (!isApiReady(this.api)) {
                throw new SDKError('API Client is not ready', 'INVALID_API_CLIENT');
            }
            if (!isKeyringReady(this.keyring)) {
                throw new SDKError('Keyring Pair is required', 'INVALID_KEYRING');
            }
            return oss.authorize(this.api, this.keyring, accountId, options);
        }

        proxyAuthorize(account: AccountIdInput,
                       sig: ProxySig,
                       payload: OssProxyAuthPayload, options?: TransactionOptions): Promise<TransactionResult> {
            if (!isApiReady(this.api)) {
                throw new SDKError('API Client is not ready', 'INVALID_API_CLIENT');
            }
            if (!isKeyringReady(this.keyring)) {
                throw new SDKError('Keyring Pair is required', 'INVALID_KEYRING');
            }
            return oss.proxyAuthorize(this.api, this.keyring, account, sig, payload, options);
        }

        cancelOssAuthorize(accountId: AccountIdInput, options?: TransactionOptions): Promise<TransactionResult> {
            if (!isApiReady(this.api)) {
                throw new SDKError('API Client is not ready', 'INVALID_API_CLIENT');
            }
            if (!isKeyringReady(this.keyring)) {
                throw new SDKError('Keyring Pair is required', 'INVALID_KEYRING');
            }
            return oss.cancelAuthorize(this.api, this.keyring, accountId, options);
        }

        registerOssNode(domain: string, options?: TransactionOptions): Promise<TransactionResult> {
            if (!isApiReady(this.api)) {
                throw new SDKError('API Client is not ready', 'INVALID_API_CLIENT');
            }
            if (!isKeyringReady(this.keyring)) {
                throw new SDKError('Keyring Pair is required', 'INVALID_KEYRING');
            }
            return oss.registerOssNode(this.api, this.keyring, domain, options);
        }

        updateOssEndpoint(domain: string, options?: TransactionOptions): Promise<TransactionResult> {
            if (!isApiReady(this.api)) {
                throw new SDKError('API Client is not ready', 'INVALID_API_CLIENT');
            }
            if (!isKeyringReady(this.keyring)) {
                throw new SDKError('Keyring Pair is required', 'INVALID_KEYRING');
            }
            return oss.updateOssEndpoint(this.api, this.keyring, domain, options);
        }

        destroyOss(options?: TransactionOptions): Promise<TransactionResult> {
            if (!isApiReady(this.api)) {
                throw new SDKError('API Client is not ready', 'INVALID_API_CLIENT');
            }
            if (!isKeyringReady(this.keyring)) {
                throw new SDKError('Keyring Pair is required', 'INVALID_KEYRING');
            }
            return oss.destroyOss(this.api, this.keyring, options);
        }
    }
}