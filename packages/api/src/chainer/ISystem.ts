import { SignedBlock } from "@polkadot/types/interfaces";
import { AccountIdInput, AccountInfoData, AccountInfoDetail, BlockHashInput, BlockNumberInput, SysSyncState } from "@cessnetwork/types";
import { ChainProperties, Health } from "@polkadot/types/interfaces/system";

export interface ISystem {
    queryBlockNumberByHash(hash?: BlockHashInput): Promise<number>
    queryAccountById(account?: AccountIdInput, block?: BlockNumberInput): Promise<AccountInfoData | AccountInfoDetail[] | null>
    queryBlockHashByNumber(blockNumber: BlockNumberInput): Promise<string>
    queryFinalizedHead(): Promise<string>
    queryBlockDataByHash(hash?: BlockHashInput): Promise<SignedBlock>
    queryChainName(): Promise<string>
    queryChainType(): Promise<string>
    queryChainHealthStatus(): Promise<Health>
    queryChainProperties(): Promise<ChainProperties>
    queryChainVersion(): Promise<string>
    queryCurrentNonce(): Promise<number>
    getBlockByHash(hash: string): Promise<SignedBlock>;
    getBlockHashByBlockNum(block?: BlockNumberInput): Promise<string>;
    getFinalizedHeadHash(): Promise<string>;
    isNetListening(): Promise<boolean>;
    getSystemSyncState(): Promise<SysSyncState>;
    getSystemVersion(): Promise<string>;
    rotateKeys(): Promise<any>
}
