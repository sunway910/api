import { AccountId } from "@polkadot/types/interfaces";
import {
    AccountIdInput,
    BlockNumberInput,
    CompleteSnapShotType, EraInput, ExpanderInfo, MinerCompleteDetail, MinerCompleteInfo, MinerInfo, MinerInfoDetail, MinerReward,
    MinerRewardDetail, MinerStakingStartBlock, PendingReplacement, PoISKeyInfo, RestoralTargetInfo, RestoralTargetInfoDetail, Space, Token
} from "@cessnetwork/types";
import { Bytes } from "@polkadot/types";
import { TransactionOptions, TransactionResult } from "@/utils/tx";

export interface ISminer {
    queryExpander(block?: BlockNumberInput): Promise<ExpanderInfo | null>;
    queryMinerByAccountId(accountId: AccountIdInput, block?: BlockNumberInput): Promise<MinerInfo | MinerInfoDetail[] | null>;
    queryStakingStartBlock(accountId: AccountIdInput, block?: BlockNumberInput): Promise<number | MinerStakingStartBlock[]>;
    queryAllMiner(block?: BlockNumberInput): Promise<AccountId[]>;
    queryCounterForMinerItems(block?: BlockNumberInput): Promise<number>;
    queryRewardMapByAccountId(accountId: AccountIdInput, block?: BlockNumberInput): Promise<MinerReward | MinerRewardDetail[] | null>;
    queryMinerLockByAccountId(accountId: AccountIdInput, block?: BlockNumberInput): Promise<MinerReward | null>;
    queryRestoralTargetByAccountId(accountId: AccountIdInput, block?: BlockNumberInput): Promise<RestoralTargetInfo | RestoralTargetInfoDetail[] | null>;
    queryPendingReplacements(accountId: AccountIdInput, block?: BlockNumberInput): Promise<number | PendingReplacement[] | null>;
    queryCompleteSnapShot(era: EraInput, block?: BlockNumberInput): Promise<CompleteSnapShotType | null>;
    queryCompleteMinerSnapShot(accountId?: AccountIdInput, block?: BlockNumberInput): Promise<MinerCompleteInfo[] | MinerCompleteDetail[]>;

    increaseCollateral(account: AccountIdInput, token: Token, options?: TransactionOptions): Promise<TransactionResult>;
    increaseDeclarationSpace(tibCount: Space, options?: TransactionOptions): Promise<TransactionResult>;
    minerExitPrep(options?: TransactionOptions): Promise<TransactionResult>;
    minerWithdraw(options?: TransactionOptions): Promise<TransactionResult>;
    receiveReward(options?: TransactionOptions): Promise<TransactionResult>;
    registerPoisKey(poisKey: PoISKeyInfo, teeSignWithAcc: Bytes, teeSign: Bytes, teePuk: string, options?: TransactionOptions): Promise<TransactionResult>;
    regnstkSminer(earningAcc: AccountIdInput, endpoint: string, staking: bigint, tibCount: Space, options?: TransactionOptions): Promise<TransactionResult>;
    regnstkAssignStaking(earningAcc: AccountIdInput, endpoint:  string, stakingAcc: string, tibCount: Space, options?: TransactionOptions): Promise<TransactionResult>;
    updateBeneficiary(earningAcc: AccountIdInput, options?: TransactionOptions): Promise<TransactionResult>;
    updateSminerEndpoint(endpoint:  string, options?: TransactionOptions): Promise<TransactionResult>;
}
