import { Bytes } from "@polkadot/types";
import { AccountIdInput, BlockNumberInput, Consignment, ConsignmentDetail, Day, OrderId, OrderType, Price, Space, StorageHandlerOrder, StorageHandlerOrderDetail, Territory, TerritoryDetail, Token } from "@cessnetwork/types";
import { TransactionOptions, TransactionResult } from "@/utils/tx";

export interface IStorageHandler {
    queryUnitPrice(block?: BlockNumberInput): Promise<bigint>;

    queryTotalIdleSpace(block?: BlockNumberInput): Promise<bigint>;

    queryTotalServiceSpace(block?: BlockNumberInput): Promise<bigint>;

    queryPurchasedSpace(block?: BlockNumberInput): Promise<bigint>;

    queryPayOrder(
        hash?: OrderId,
        blockNumber?: BlockNumberInput
    ): Promise<StorageHandlerOrder | StorageHandlerOrderDetail[] | null>

    queryTerritory(accountId: AccountIdInput, territoryName?: string, block?: BlockNumberInput): Promise<Territory | TerritoryDetail[] | null>;

    queryConsignment(token: Token, block?: BlockNumberInput): Promise<Consignment | ConsignmentDetail[] | null>;

    mintTerritory(gibCount: Space, territoryName: string | Bytes, days: Day, options?: TransactionOptions): Promise<TransactionResult>;

    expandingTerritory(territoryName: string, gibCount: Space, options?: TransactionOptions): Promise<TransactionResult>;

    // call this func before territory expired
    renewalTerritory(territoryName: string, daysCount: Day, options?: TransactionOptions): Promise<TransactionResult>;

    // call this func after territory expired, but data will be reset
    reactivateTerritory(territoryName: string, daysCount: Day, options?: TransactionOptions): Promise<TransactionResult>;

    territoryConsignment(territoryName: string, price: Price, options?: TransactionOptions): Promise<TransactionResult>;

    cancelConsignment(territoryName: string, options?: TransactionOptions): Promise<TransactionResult>;

    buyConsignment(token: Token, territoryName: string, options?: TransactionOptions): Promise<TransactionResult>;

    cancelPurchaseAction(token: Token, options?: TransactionOptions): Promise<TransactionResult>;

    clearServiceSpace(options?: TransactionOptions): Promise<TransactionResult>;

    createOrder(
        targetAcc: AccountIdInput,
        territoryName: string,
        orderType: OrderType, // Buy / Expansion / Renewal
        gibCount: Space,
        days: Day,
        expired: number,
        options?: TransactionOptions
    ): Promise<TransactionResult>;

    defineUpdatePrice(
        price: Price, options?: TransactionOptions
    ): Promise<TransactionResult>;

    execConsignment(
        token: Token,
        territoryName: string, options?: TransactionOptions
    ): Promise<TransactionResult>;

    execOrder(
        orderId: string, options?: TransactionOptions
    ): Promise<TransactionResult>;

    fixTerritorySpaceForReactivate(
        acc: AccountIdInput,
        territoryName: string, options?: TransactionOptions
    ): Promise<TransactionResult>;

    otherReactivateTerritory(
        targetAcc: AccountIdInput,
        territoryName: string,
        days: Day, options?: TransactionOptions
    ): Promise<TransactionResult>;

    territoryGrants(
        territoryName: string,
        receiver: AccountIdInput, options?: TransactionOptions
    ): Promise<TransactionResult>;

    territoryRename(
        oldName: string,
        newName: string, options?: TransactionOptions
    ): Promise<TransactionResult>;

    updateExpiredExec(
        oldBlock: BlockNumberInput,
        newBlock: BlockNumberInput,
        token: Token, options?: TransactionOptions
    ): Promise<TransactionResult>;

    updatePrice(options?: TransactionOptions): Promise<TransactionResult>;

    updateUserTerritoryLife(user: AccountIdInput, territoryName: string, deadline: BlockNumberInput, options?: TransactionOptions): Promise<TransactionResult>;
}
