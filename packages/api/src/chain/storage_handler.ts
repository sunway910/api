import { AccountIdInput, BlockNumberInput, Consignment, ConsignmentDetail, Day, OrderId, OrderType, Price, Space, StorageHandlerOrder, StorageHandlerOrderDetail, Territory, TerritoryDetail, Token } from "@cessnetwork/types";
import { isApiReady, isKeyringReady, TransactionOptions, TransactionResult } from "@/utils/tx";
import { SDKError } from "@/utils";
import * as storageHandler from '@/pallets/storage_handler';
import type { Constructor } from "./types";
import { ChainBase } from "./types";

export function StorageHandler<TBase extends Constructor<ChainBase>>(Base: TBase) {
    return class extends Base {
        async queryUnitPrice(block?: BlockNumberInput): Promise<bigint> {
            if (!isApiReady(this.api)) {
                throw new SDKError('API Client is not ready', 'INVALID_API_CLIENT');
            }
            return storageHandler.queryUnitPrice(this.api, block);
        }

        async queryTotalIdleSpace(block?: BlockNumberInput): Promise<bigint> {
            if (!isApiReady(this.api)) {
                throw new SDKError('API Client is not ready', 'INVALID_API_CLIENT');
            }
            return storageHandler.queryTotalIdleSpace(this.api, block);
        }

        async queryTotalServiceSpace(block?: BlockNumberInput): Promise<bigint> {
            if (!isApiReady(this.api)) {
                throw new SDKError('API Client is not ready', 'INVALID_API_CLIENT');
            }
            return storageHandler.queryTotalServiceSpace(this.api, block);
        }

        async queryPurchasedSpace(block?: BlockNumberInput): Promise<bigint> {
            if (!isApiReady(this.api)) {
                throw new SDKError('API Client is not ready', 'INVALID_API_CLIENT');
            }
            return storageHandler.queryPurchasedSpace(this.api, block);
        }

        async queryPayOrder(
            orderId?: OrderId,
            block?: BlockNumberInput
        ): Promise<StorageHandlerOrder | StorageHandlerOrderDetail[] | null> {
            if (!isApiReady(this.api)) {
                throw new SDKError('API Client is not ready', 'INVALID_API_CLIENT');
            }
            return storageHandler.queryPayOrder(this.api, orderId, block);
        }

        async queryTerritory(
            accountId: AccountIdInput,
            territoryName?: string,
            block?: BlockNumberInput
        ): Promise<Territory | TerritoryDetail[] | null> {
            if (!isApiReady(this.api)) {
                throw new SDKError('API Client is not ready', 'INVALID_API_CLIENT');
            }
            return storageHandler.queryTerritory(this.api, accountId, territoryName, block);
        }

        async queryConsignment(
            token?: Token,
            block?: BlockNumberInput
        ): Promise<Consignment | ConsignmentDetail[] | null> {
            if (!isApiReady(this.api)) {
                throw new SDKError('API Client is not ready', 'INVALID_API_CLIENT');
            }
            return storageHandler.queryConsignment(this.api, token, block);
        }

        async mintTerritory(
            gibCount: Space,
            territoryName: string,
            days: Day, options?: TransactionOptions
        ): Promise<TransactionResult> {
            if (!isApiReady(this.api)) {
                throw new SDKError('API Client is not ready', 'INVALID_API_CLIENT');
            }
            if (!isKeyringReady(this.keyring)) {
                throw new SDKError('Keyring Pair is required', 'INVALID_KEYRING');
            }
            return await storageHandler.mintTerritory(this.api, this.keyring, gibCount, territoryName, days, options);
        }

        expandingTerritory(
            territoryName: string,
            gibCount: Space, options?: TransactionOptions
        ): Promise<TransactionResult> {
            if (!isApiReady(this.api)) {
                throw new SDKError('API Client is not ready', 'INVALID_API_CLIENT');
            }
            if (!isKeyringReady(this.keyring)) {
                throw new SDKError('Keyring Pair is required', 'INVALID_KEYRING');
            }
            return storageHandler.expandingTerritory(this.api, this.keyring, territoryName, gibCount, options);
        }

        renewalTerritory(
            territoryName: string,
            days: Day, options?: TransactionOptions
        ): Promise<TransactionResult> {
            if (!isApiReady(this.api)) {
                throw new SDKError('API Client is not ready', 'INVALID_API_CLIENT');
            }
            if (!isKeyringReady(this.keyring)) {
                throw new SDKError('Keyring Pair is required', 'INVALID_KEYRING');
            }
            return storageHandler.renewalTerritory(this.api, this.keyring, territoryName, days, options);
        }

        reactivateTerritory(
            territoryName: string,
            days: Day, options?: TransactionOptions
        ): Promise<TransactionResult> {
            if (!isApiReady(this.api)) {
                throw new SDKError('API Client is not ready', 'INVALID_API_CLIENT');
            }
            if (!isKeyringReady(this.keyring)) {
                throw new SDKError('Keyring Pair is required', 'INVALID_KEYRING');
            }
            return storageHandler.reactivateTerritory(this.api, this.keyring, territoryName, days, options);
        }

        territoryConsignment(
            territoryName: string,
            price: Price, options?: TransactionOptions
        ): Promise<TransactionResult> {
            if (!isApiReady(this.api)) {
                throw new SDKError('API Client is not ready', 'INVALID_API_CLIENT');
            }
            if (!isKeyringReady(this.keyring)) {
                throw new SDKError('Keyring Pair is required', 'INVALID_KEYRING');
            }
            return storageHandler.territoryConsignment(this.api, this.keyring, territoryName, price, options);
        }

        cancelConsignment(territoryName: string, options?: TransactionOptions): Promise<TransactionResult> {
            if (!isApiReady(this.api)) {
                throw new SDKError('API Client is not ready', 'INVALID_API_CLIENT');
            }
            if (!isKeyringReady(this.keyring)) {
                throw new SDKError('Keyring Pair is required', 'INVALID_KEYRING');
            }
            return storageHandler.cancelConsignment(this.api, this.keyring, territoryName, options);
        }

        buyConsignment(
            token: Token,
            territoryName: string, options?: TransactionOptions
        ): Promise<TransactionResult> {
            if (!isApiReady(this.api)) {
                throw new SDKError('API Client is not ready', 'INVALID_API_CLIENT');
            }
            if (!isKeyringReady(this.keyring)) {
                throw new SDKError('Keyring Pair is required', 'INVALID_KEYRING');
            }
            return storageHandler.buyConsignment(this.api, this.keyring, token, territoryName, options);
        }

        cancelPurchaseAction(token: Token, options?: TransactionOptions): Promise<TransactionResult> {
            if (!isApiReady(this.api)) {
                throw new SDKError('API Client is not ready', 'INVALID_API_CLIENT');
            }
            if (!isKeyringReady(this.keyring)) {
                throw new SDKError('Keyring Pair is required', 'INVALID_KEYRING');
            }
            return storageHandler.cancelPurchaseAction(this.api, this.keyring, token, options);
        }

        clearServiceSpace(options?: TransactionOptions): Promise<TransactionResult> {
            if (!isApiReady(this.api)) {
                throw new SDKError('API Client is not ready', 'INVALID_API_CLIENT');
            }
            if (!isKeyringReady(this.keyring)) {
                throw new SDKError('Keyring Pair is required', 'INVALID_KEYRING');
            }
            return storageHandler.clearServiceSpace(this.api, this.keyring, options);
        }

        createOrder(
            targetAcc: AccountIdInput,
            territoryName: string,
            orderType: OrderType,
            gibCount: Space,
            days: Day,
            expiredAfterNMinutes: number, options?: TransactionOptions
        ): Promise<TransactionResult> {
            if (!isApiReady(this.api)) {
                throw new SDKError('API Client is not ready', 'INVALID_API_CLIENT');
            }
            if (!isKeyringReady(this.keyring)) {
                throw new SDKError('Keyring Pair is required', 'INVALID_KEYRING');
            }
            return storageHandler.createOrder(this.api, this.keyring, targetAcc, territoryName, orderType, gibCount, days, expiredAfterNMinutes, options);
        }

        defineUpdatePrice(price: Price, options?: TransactionOptions): Promise<TransactionResult> {
            if (!isApiReady(this.api)) {
                throw new SDKError('API Client is not ready', 'INVALID_API_CLIENT');
            }
            if (!isKeyringReady(this.keyring)) {
                throw new SDKError('Keyring Pair is required', 'INVALID_KEYRING');
            }
            return storageHandler.defineUpdatePrice(this.api, this.keyring, price, options);
        }

        execConsignment(
            token: Token,
            territoryName: string, options?: TransactionOptions
        ): Promise<TransactionResult> {
            if (!isApiReady(this.api)) {
                throw new SDKError('API Client is not ready', 'INVALID_API_CLIENT');
            }
            if (!isKeyringReady(this.keyring)) {
                throw new SDKError('Keyring Pair is required', 'INVALID_KEYRING');
            }
            return storageHandler.execConsignment(this.api, this.keyring, token, territoryName, options);
        }

        execOrder(orderId: OrderId, options?: TransactionOptions): Promise<TransactionResult> {
            if (!isApiReady(this.api)) {
                throw new SDKError('API Client is not ready', 'INVALID_API_CLIENT');
            }
            if (!isKeyringReady(this.keyring)) {
                throw new SDKError('Keyring Pair is required', 'INVALID_KEYRING');
            }
            return storageHandler.execOrder(this.api, this.keyring, orderId, options);
        }

        fixTerritorySpaceForReactivate(
            accountId: AccountIdInput,
            territoryName: string, options?: TransactionOptions
        ): Promise<TransactionResult> {
            if (!isApiReady(this.api)) {
                throw new SDKError('API Client is not ready', 'INVALID_API_CLIENT');
            }
            if (!isKeyringReady(this.keyring)) {
                throw new SDKError('Keyring Pair is required', 'INVALID_KEYRING');
            }
            return storageHandler.fixTerritorySpaceForReactivate(this.api, this.keyring, accountId, territoryName, options);
        }

        otherReactivateTerritory(
            targetAcc: AccountIdInput,
            territoryName: string,
            days: Day, options?: TransactionOptions
        ): Promise<TransactionResult> {
            if (!isApiReady(this.api)) {
                throw new SDKError('API Client is not ready', 'INVALID_API_CLIENT');
            }
            if (!isKeyringReady(this.keyring)) {
                throw new SDKError('Keyring Pair is required', 'INVALID_KEYRING');
            }
            return storageHandler.otherReactivateTerritory(this.api, this.keyring, targetAcc, territoryName, days, options);
        }

        territoryGrants(
            territoryName: string,
            receiver: AccountIdInput, options?: TransactionOptions
        ): Promise<TransactionResult> {
            if (!isApiReady(this.api)) {
                throw new SDKError('API Client is not ready', 'INVALID_API_CLIENT');
            }
            if (!isKeyringReady(this.keyring)) {
                throw new SDKError('Keyring Pair is required', 'INVALID_KEYRING');
            }
            return storageHandler.territoryGrants(this.api, this.keyring, territoryName, receiver, options);
        }

        territoryRename(
            oldName: string,
            newName: string, options?: TransactionOptions
        ): Promise<TransactionResult> {
            if (!isApiReady(this.api)) {
                throw new SDKError('API Client is not ready', 'INVALID_API_CLIENT');
            }
            if (!isKeyringReady(this.keyring)) {
                throw new SDKError('Keyring Pair is required', 'INVALID_KEYRING');
            }
            return storageHandler.territoryRename(this.api, this.keyring, oldName, newName, options);
        }

        updateExpiredExec(
            oldBlock: BlockNumberInput,
            newBlock: BlockNumberInput,
            token: Token, options?: TransactionOptions
        ): Promise<TransactionResult> {
            if (!isApiReady(this.api)) {
                throw new SDKError('API Client is not ready', 'INVALID_API_CLIENT');
            }
            if (!isKeyringReady(this.keyring)) {
                throw new SDKError('Keyring Pair is required', 'INVALID_KEYRING');
            }
            return storageHandler.updateExpiredExec(this.api, this.keyring, oldBlock, newBlock, token, options);
        }

        updatePrice(options?: TransactionOptions): Promise<TransactionResult> {
            if (!isApiReady(this.api)) {
                throw new SDKError('API Client is not ready', 'INVALID_API_CLIENT');
            }
            if (!isKeyringReady(this.keyring)) {
                throw new SDKError('Keyring Pair is required', 'INVALID_KEYRING');
            }
            return storageHandler.updatePrice(this.api, this.keyring, options);
        }

        updateUserTerritoryLife(
            user: AccountIdInput,
            territoryName: string,
            deadline: BlockNumberInput,
            options?: TransactionOptions
        ): Promise<TransactionResult> {
            if (!isApiReady(this.api)) {
                throw new SDKError('API Client is not ready', 'INVALID_API_CLIENT');
            }
            if (!isKeyringReady(this.keyring)) {
                throw new SDKError('Keyring Pair is required', 'INVALID_KEYRING');
            }
            return storageHandler.updateUserTerritoryLife(this.api, this.keyring, user, territoryName, deadline, options);
        }
    }
}