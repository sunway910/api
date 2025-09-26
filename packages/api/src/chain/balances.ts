import { AccountIdInput, AccountLock, BlockNumberInput, BalanceInput, MultiAddressInput } from '@cessnetwork/types';
import { TransactionOptions, TransactionResult } from "@/utils/tx";
import { isApiReady, isKeyringReady } from "@/utils/tx";
import { SDKError } from "@/utils";
import * as balances from '../pallets/balances';
import type { Constructor } from "./types";
import { ChainBase } from "./types";
import { BatchTransferOptions, BatchTransferRecipient, BatchTransferResult } from "@/pallets/balances";

export function Balances<TBase extends Constructor<ChainBase>>(Base: TBase) {
    return class extends Base {

        async queryBalanceHoldsByAccountId(accountId: AccountIdInput, block?: BlockNumberInput): Promise<any> {
            if (!isApiReady(this.api)) {
                throw new SDKError('API Client is not ready', 'INVALID_API_CLIENT');
            }
            return balances.queryBalanceHoldsByAccountId(this.api, accountId, block);
        }

        async queryBalanceLocksByAccountId(accountId: AccountIdInput, block?: BlockNumberInput): Promise<AccountLock> {
            if (!isApiReady(this.api)) {
                throw new SDKError('API Client is not ready', 'INVALID_API_CLIENT');
            }
            return balances.queryBalanceLocksByAccountId(this.api, accountId, block);
        }

        async queryTotalIssuance(block?: BlockNumberInput): Promise<BigInt> {
            if (!isApiReady(this.api)) {
                throw new SDKError('API Client is not ready', 'INVALID_API_CLIENT');
            }
            return balances.queryTotalIssuance(this.api, block);
        }

        async queryInactiveIssuance(block?: BlockNumberInput): Promise<BigInt> {
            if (!isApiReady(this.api)) {
                throw new SDKError('API Client is not ready', 'INVALID_API_CLIENT');
            }
            return balances.queryInactiveIssuance(this.api, block);
        }

        transferAll(dest: MultiAddressInput, keepAlive: Boolean, options?: TransactionOptions): Promise<TransactionResult> {
            if (!isApiReady(this.api)) {
                throw new SDKError('API Client is not ready', 'INVALID_API_CLIENT');
            }
            if (!isKeyringReady(this.keyring)) {
                throw new SDKError('Keyring Pair is required', 'INVALID_KEYRING');
            }
            return balances.transferAll(this.api, this.keyring, dest, keepAlive, options);
        }

        transferAllowDeath(dest: MultiAddressInput, value: BalanceInput, options?: TransactionOptions): Promise<TransactionResult> {
            if (!isApiReady(this.api)) {
                throw new SDKError('API Client is not ready', 'INVALID_API_CLIENT');
            }
            if (!isKeyringReady(this.keyring)) {
                throw new SDKError('Keyring Pair is required', 'INVALID_KEYRING');
            }
            return balances.transferAllowDeath(this.api, this.keyring, dest, value, options);
        }

        transferKeepAlive(dest: MultiAddressInput, value: BalanceInput, options?: TransactionOptions): Promise<TransactionResult> {
            if (!isApiReady(this.api)) {
                throw new SDKError('API Client is not ready', 'INVALID_API_CLIENT');
            }
            if (!isKeyringReady(this.keyring)) {
                throw new SDKError('Keyring Pair is required', 'INVALID_KEYRING');
            }
            return balances.transferKeepAlive(this.api, this.keyring, dest, value, options);
        }

        burn(value: BalanceInput, keepAlive: Boolean, options?: TransactionOptions): Promise<TransactionResult> {
            if (!isApiReady(this.api)) {
                throw new SDKError('API Client is not ready', 'INVALID_API_CLIENT');
            }
            if (!isKeyringReady(this.keyring)) {
                throw new SDKError('Keyring Pair is required', 'INVALID_KEYRING');
            }
            return balances.burn(this.api, this.keyring, value, keepAlive, options);
        }

        batchTransferKeepAlive(recipients: BatchTransferRecipient[], options: BatchTransferOptions = {}): Promise<BatchTransferResult> {
            if (!isApiReady(this.api)) {
                throw new SDKError('API Client is not ready', 'INVALID_API_CLIENT');
            }
            if (!isKeyringReady(this.keyring)) {
                throw new SDKError('Keyring Pair is required', 'INVALID_KEYRING');
            }
            return balances.batchTransferKeepAlive(this.api, this.keyring, recipients, options);
        }
    }
}
