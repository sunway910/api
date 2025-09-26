import { AccountId } from "@polkadot/types/interfaces";
import { AccountIdInput, Accumulator, BlockNumberInput, BloomFilter, ChallengeInfo, TeeSig, TeeWorkerPublicKey } from "@cessnetwork/types";
import { TransactionOptions, TransactionResult } from "@/utils/tx";
import { bool, u64 } from "@polkadot/types";

export interface IAudit {
    queryChallengeSnapShot(accountId: AccountIdInput, block?: BlockNumberInput): Promise<ChallengeInfo | null>;
    queryCountedClear(accountId: AccountIdInput, block?: BlockNumberInput): Promise<number>;
    queryCountedServiceFailed(accountId: AccountIdInput, block?: BlockNumberInput): Promise<number>;

    updateCountedClear(accountId: AccountId | string, options?: TransactionOptions): Promise<TransactionResult>;
    submitIdleProof(idleProof: Uint8Array, options?: TransactionOptions): Promise<TransactionResult>;
    submitServiceProof(serviceProof: Uint8Array, options?: TransactionOptions): Promise<TransactionResult>;
    submitVerifyIdleResult(
        totalProofHash: string | Uint8Array,
        front: number | u64 | bigint,
        rear: number | u64 | bigint,
        accumulator: Accumulator,
        result: Boolean | bool,
        sig: TeeSig,
        teePuk: TeeWorkerPublicKey,
        options?: TransactionOptions
    ): Promise<TransactionResult>;
    submitVerifyServiceResult(
        serviceResult: bool | Boolean,
        signature: TeeSig,
        bloomFilter: BloomFilter,
        teePuk: TeeWorkerPublicKey,
        options?: TransactionOptions
    ): Promise<TransactionResult>;
}
