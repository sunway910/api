import { SignedBlock } from "@polkadot/types/interfaces";
import { AccountIdInput, AccountInfoData, AccountInfoDetail, BlockHashInput, BlockNumberInput, SysSyncState } from "@cessnetwork/types";
import { ChainProperties, Health } from "@polkadot/types/interfaces/system";
import { isApiReady, isKeyringReady } from "@/utils/tx";
import { SDKError } from "@/utils";
import * as system from '@/pallets/system';
import type { Constructor } from "./types";
import { ChainBase } from "./types";

export function System<TBase extends Constructor<ChainBase>>(Base: TBase) {
    return class extends Base {
        async queryBlockNumberByHash(hash?: BlockHashInput): Promise<number> {
            if (!isApiReady(this.api)) {
                throw new SDKError('API Client is not ready', 'INVALID_API_CLIENT');
            }
            return system.queryBlockNumberByHash(this.api, hash);
        }

        async queryAccountById(account: AccountIdInput, block?: BlockNumberInput): Promise<AccountInfoData | AccountInfoDetail[] | null> {
            if (!isApiReady(this.api)) {
                throw new SDKError('API Client is not ready', 'INVALID_API_CLIENT');
            }
            return system.queryAccountById(this.api, account, block);
        }

        async queryBlockHashByNumber(blockNumber: BlockNumberInput): Promise<string> {
            if (!isApiReady(this.api)) {
                throw new SDKError('API Client is not ready', 'INVALID_API_CLIENT');
            }
            return system.queryBlockHashByNumber(this.api, blockNumber);
        }

        async queryFinalizedHead(): Promise<string> {
            if (!isApiReady(this.api)) {
                throw new SDKError('API Client is not ready', 'INVALID_API_CLIENT');
            }
            return system.queryFinalizedHead(this.api);
        }

        async queryBlockDataByHash(hash?: BlockHashInput): Promise<SignedBlock> {
            if (!isApiReady(this.api)) {
                throw new SDKError('API Client is not ready', 'INVALID_API_CLIENT');
            }
            return system.queryBlockDataByHash(this.api, hash);
        }

        async queryChainName(): Promise<string> {
            if (!isApiReady(this.api)) {
                throw new SDKError('API Client is not ready', 'INVALID_API_CLIENT');
            }
            return system.queryChainName(this.api);
        }

        async queryChainType(): Promise<string> {
            if (!isApiReady(this.api)) {
                throw new SDKError('API Client is not ready', 'INVALID_API_CLIENT');
            }
            return system.queryChainType(this.api);
        }

        async queryChainHealthStatus(): Promise<Health> {
            if (!isApiReady(this.api)) {
                throw new SDKError('API Client is not ready', 'INVALID_API_CLIENT');
            }
            return system.queryChainHealthStatus(this.api);
        }

        async queryChainProperties(): Promise<ChainProperties> {
            if (!isApiReady(this.api)) {
                throw new SDKError('API Client is not ready', 'INVALID_API_CLIENT');
            }
            return system.queryChainProperties(this.api);
        }

        async queryChainVersion(): Promise<string> {
            if (!isApiReady(this.api)) {
                throw new SDKError('API Client is not ready', 'INVALID_API_CLIENT');
            }
            return system.queryChainVersion(this.api);
        }

        async queryCurrentNonce(): Promise<number> {
            if (!isApiReady(this.api)) {
                throw new SDKError('API Client is not ready', 'INVALID_API_CLIENT');
            }
            if (!isKeyringReady(this.keyring)) {
                throw new SDKError('Keyring Pair is required', 'INVALID_KEYRING');
            }
            if (!this.keyring) throw new Error('Please init api client with a valid Keyring');
            return system.queryCurrentNonce(this.api, this.keyring);
        }

        async getBlockByHash(hash: string): Promise<SignedBlock> {
            if (!isApiReady(this.api)) {
                throw new SDKError('API Client is not ready', 'INVALID_API_CLIENT');
            }
            return system.getBlockByHash(this.api, hash);
        }

        async getBlockHashByBlockNum(block?: BlockNumberInput): Promise<string> {
            if (!isApiReady(this.api)) {
                throw new SDKError('API Client is not ready', 'INVALID_API_CLIENT');
            }
            return system.getBlockHashByBlockNum(this.api, block);
        }

        async getFinalizedHeadHash(): Promise<string> {
            if (!isApiReady(this.api)) {
                throw new SDKError('API Client is not ready', 'INVALID_API_CLIENT');
            }
            return system.getFinalizedHeadHash(this.api);
        }

        async isNetListening(): Promise<boolean> {
            if (!isApiReady(this.api)) {
                throw new SDKError('API Client is not ready', 'INVALID_API_CLIENT');
            }
            return system.isNetListening(this.api);
        }

        async getSystemSyncState(): Promise<SysSyncState> {
            if (!isApiReady(this.api)) {
                throw new SDKError('API Client is not ready', 'INVALID_API_CLIENT');
            }
            return system.systemSyncState(this.api);
        }

        async getSystemVersion(): Promise<string> {
            if (!isApiReady(this.api)) {
                throw new SDKError('API Client is not ready', 'INVALID_API_CLIENT');
            }
            return system.systemVersion(this.api);
        }

        async rotateKeys(): Promise<string | any> {
            if (!isApiReady(this.api)) {
                throw new SDKError('API Client is not ready', 'INVALID_API_CLIENT');
            }
            return system.rotateKeys(this.api);
        }
    }
}