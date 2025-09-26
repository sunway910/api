import { AccountIdInput, Accumulator, BlockNumberInput, BloomFilter, ChallengeInfo, SpaceProof, TeeSig, TeeWorkerPublicKey } from '@cessnetwork/types';
import { TransactionOptions, TransactionResult } from "@/utils/tx";
import { isApiReady, isKeyringReady } from "@/utils/tx";
import { SDKError } from "@/utils";
import * as audit from '@/pallets/audit';
import type { Constructor } from "./types";
import { ChainBase } from "./types";
import { bool, u64 } from "@polkadot/types";

export function Audit<TBase extends Constructor<ChainBase>>(Base: TBase) {
    return class extends Base {
        async queryChallengeSnapShot(accountId: AccountIdInput,
                                     block?: BlockNumberInput): Promise<ChallengeInfo | null> {
            if (!isApiReady(this.api)) {
                throw new SDKError('API Client is not ready', 'INVALID_API_CLIENT');
            }
            return audit.queryChallengeSnapShot(this.api, accountId, block);
        }

        async queryCountedClear(accountId: AccountIdInput,
                                block?: BlockNumberInput): Promise<number> {
            if (!isApiReady(this.api)) {
                throw new SDKError('API Client is not ready', 'INVALID_API_CLIENT');
            }
            return audit.queryCountedClear(this.api, accountId, block);
        }

        updateCountedClear(accountId: AccountIdInput, options?: TransactionOptions): Promise<TransactionResult> {
            if (!isApiReady(this.api)) {
                throw new SDKError('API Client is not ready', 'INVALID_API_CLIENT');
            }
            if (!isKeyringReady(this.keyring)) {
                throw new SDKError('Keyring Pair is required', 'INVALID_KEYRING');
            }
            return audit.updateCountedClear(this.api, this.keyring, accountId, options);
        }

        async queryCountedServiceFailed(accountId: AccountIdInput,
                                        block?: BlockNumberInput): Promise<number> {
            if (!isApiReady(this.api)) {
                throw new SDKError('API Client is not ready', 'INVALID_API_CLIENT');
            }
            if (!isKeyringReady(this.keyring)) {
                throw new SDKError('Keyring Pair is required', 'INVALID_KEYRING');
            }
            return audit.queryCountedServiceFailed(this.api, accountId, block);
        }

        submitIdleProof(idleProof: SpaceProof, options?: TransactionOptions): Promise<TransactionResult> {
            if (!isApiReady(this.api)) {
                throw new SDKError('API Client is not ready', 'INVALID_API_CLIENT');
            }
            if (!isKeyringReady(this.keyring)) {
                throw new SDKError('Keyring Pair is required', 'INVALID_KEYRING');
            }
            return audit.submitIdleProof(this.api, this.keyring, idleProof, options);
        }

        submitServiceProof(serviceProof: SpaceProof, options?: TransactionOptions): Promise<TransactionResult> {
            if (!isApiReady(this.api)) {
                throw new SDKError('API Client is not ready', 'INVALID_API_CLIENT');
            }
            if (!isKeyringReady(this.keyring)) {
                throw new SDKError('Keyring Pair is required', 'INVALID_KEYRING');
            }
            return audit.submitServiceProof(this.api, this.keyring, serviceProof, options);
        }

        submitVerifyIdleResult(
            totalProofHash: string | Uint8Array,
            front: number | u64 | bigint,
            rear: number | u64 | bigint,
            accumulator: Accumulator,
            result: Boolean | bool,
            sig: TeeSig,
            teePuk: TeeWorkerPublicKey,
            options?: TransactionOptions
        ): Promise<TransactionResult> {
            if (!isApiReady(this.api)) {
                throw new SDKError('API Client is not ready', 'INVALID_API_CLIENT');
            }
            if (!isKeyringReady(this.keyring)) {
                throw new SDKError('Keyring Pair is required', 'INVALID_KEYRING');
            }
            return audit.submitVerifyIdleResult(this.api, this.keyring, totalProofHash, front, rear, accumulator, result, sig, teePuk, options);
        }

        submitVerifyServiceResult(
            serviceResult: bool | Boolean,
            signature: TeeSig,
            bloomFilter: BloomFilter,
            teePuk: TeeWorkerPublicKey,
            options?: TransactionOptions
        ): Promise<TransactionResult> {
            if (!isApiReady(this.api)) {
                throw new SDKError('API Client is not ready', 'INVALID_API_CLIENT');
            }
            if (!isKeyringReady(this.keyring)) {
                throw new SDKError('Keyring Pair is required', 'INVALID_KEYRING');
            }
            return audit.submitVerifyServiceResult(this.api, this.keyring, serviceResult, signature, bloomFilter, teePuk, options);
        }
    }
}
