import { AccountIdInput, AccountLock, BlockNumberInput, BalanceInput, MultiAddressInput } from "@cessnetwork/types";
import { TransactionOptions, TransactionResult } from "@/utils/tx";
import { BatchTransferOptions, BatchTransferRecipient, BatchTransferResult } from "@/pallets/balances";

export interface IBalances {
    queryBalanceHoldsByAccountId(accountId: AccountIdInput, block?: BlockNumberInput,): Promise<any>

    queryBalanceLocksByAccountId(accountId: AccountIdInput, block?: BlockNumberInput,): Promise<AccountLock>

    queryTotalIssuance(block?: BlockNumberInput,): Promise<BigInt>;

    queryInactiveIssuance(block?: BlockNumberInput,): Promise<BigInt>;

    transferAll(dest: MultiAddressInput, keepAlive: Boolean, options?: TransactionOptions): Promise<TransactionResult>;

    transferAllowDeath(dest: MultiAddressInput, value: BalanceInput, options?: TransactionOptions): Promise<TransactionResult>;

    transferKeepAlive(dest: MultiAddressInput, value: BalanceInput, options?: TransactionOptions): Promise<TransactionResult>;

    burn(value: BalanceInput, keepAlive: Boolean, options?: TransactionOptions): Promise<TransactionResult>;

    batchTransferKeepAlive(recipients: BatchTransferRecipient[], options?: BatchTransferOptions): Promise<BatchTransferResult>;
}
