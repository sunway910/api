import { AccountId } from "@polkadot/types/interfaces";
import {
    AccountIdInput, BalanceInput, BlockNumberInput,
    CompleteSnapShotType, EraInput,
    ExpanderInfo,
    MinerCompleteDetail,
    MinerCompleteInfo,
    MinerInfo,
    MinerInfoDetail,
    MinerReward,
    MinerRewardDetail,
    MinerStakingStartBlock,
    PendingReplacement,
    PoISKeyInfo,
    RestoralTargetInfo,
    RestoralTargetInfoDetail, Space, TeeSig, TeeWorkerPublicKey, Token
} from "@cessnetwork/types";
import { TransactionOptions, TransactionResult } from "@/utils/tx";
import { isApiReady, isKeyringReady } from "@/utils/tx";
import { SDKError } from "@/utils";
import * as sminer from '@/pallets/sminer';
import type { Constructor } from "./types";
import { ChainBase } from "./types";

export function Sminer<TBase extends Constructor<ChainBase>>(Base: TBase) {
    return class extends Base {
        async queryExpander(block?: BlockNumberInput): Promise<ExpanderInfo | null> {
            if (!isApiReady(this.api)) {
                throw new SDKError('API Client is not ready', 'INVALID_API_CLIENT');
            }
            return sminer.queryExpanders(this.api, block);
        }

        async queryMinerByAccountId(accountId?: AccountIdInput,
                                    block?: BlockNumberInput): Promise<MinerInfo | MinerInfoDetail[] | null> {
            if (!isApiReady(this.api)) {
                throw new SDKError('API Client is not ready', 'INVALID_API_CLIENT');
            }
            return sminer.queryMinerByAccountId(this.api, accountId, block);
        }

        async queryStakingStartBlock(accountId?: AccountIdInput,
                                     block?: BlockNumberInput): Promise<number | MinerStakingStartBlock[]> {
            if (!isApiReady(this.api)) {
                throw new SDKError('API Client is not ready', 'INVALID_API_CLIENT');
            }
            return sminer.queryStakingStartBlock(this.api, accountId, block);
        }

        async queryAllMiner(block?: BlockNumberInput): Promise<AccountId[]> {
            if (!isApiReady(this.api)) {
                throw new SDKError('API Client is not ready', 'INVALID_API_CLIENT');
            }
            return sminer.queryAllMinerAddress(this.api, block);
        }

        async queryCounterForMinerItems(block?: BlockNumberInput): Promise<number> {
            if (!isApiReady(this.api)) {
                throw new SDKError('API Client is not ready', 'INVALID_API_CLIENT');
            }
            return sminer.queryTotalNumberOfStorageMiner(this.api, block);
        }

        async queryRewardMapByAccountId(accountId?: AccountIdInput,
                                        block?: BlockNumberInput): Promise<MinerReward | MinerRewardDetail[] | null> {
            if (!isApiReady(this.api)) {
                throw new SDKError('API Client is not ready', 'INVALID_API_CLIENT');
            }
            return sminer.queryRewardMapByAccountId(this.api, accountId, block);
        }

        async queryMinerLockByAccountId(accountId: AccountIdInput,
                                        block?: BlockNumberInput): Promise<MinerReward | null> {
            if (!isApiReady(this.api)) {
                throw new SDKError('API Client is not ready', 'INVALID_API_CLIENT');
            }
            return sminer.queryMinerLockByAccountId(this.api, accountId, block);
        }

        async queryRestoralTargetByAccountId(accountId?: AccountIdInput,
                                             block?: BlockNumberInput): Promise<RestoralTargetInfo | RestoralTargetInfoDetail[] | null> {
            if (!isApiReady(this.api)) {
                throw new SDKError('API Client is not ready', 'INVALID_API_CLIENT');
            }
            return sminer.queryRestoralTargetByAccountId(this.api, accountId, block);
        }

        async queryPendingReplacements(accountId?: AccountIdInput,
                                       block?: BlockNumberInput): Promise<number | PendingReplacement[] | null> {
            if (!isApiReady(this.api)) {
                throw new SDKError('API Client is not ready', 'INVALID_API_CLIENT');
            }
            return sminer.queryPendingReplacements(this.api, accountId, block);
        }

        async queryCompleteSnapShot(era: EraInput,
                                    block?: BlockNumberInput): Promise<CompleteSnapShotType | null> {
            if (!isApiReady(this.api)) {
                throw new SDKError('API Client is not ready', 'INVALID_API_CLIENT');
            }
            return sminer.queryCompleteSnapShotByEraNumber(this.api, era, block);
        }

        async queryCompleteMinerSnapShot(accountId?: AccountIdInput,
                                         block?: BlockNumberInput): Promise<MinerCompleteInfo[] | MinerCompleteDetail[]> {
            if (!isApiReady(this.api)) {
                throw new SDKError('API Client is not ready', 'INVALID_API_CLIENT');
            }
            return sminer.queryCompleteMinerSnapShotByAccountId(this.api, accountId, block);
        }

        increaseCollateral(account: AccountIdInput,
                           token: Token, options?: TransactionOptions): Promise<TransactionResult> {
            if (!isApiReady(this.api)) {
                throw new SDKError('API Client is not ready', 'INVALID_API_CLIENT');
            }
            if (!isKeyringReady(this.keyring)) {
                throw new SDKError('Keyring Pair is required', 'INVALID_KEYRING');
            }
            return sminer.increaseCollateral(this.api, this.keyring, account, token, options);
        }

        increaseDeclarationSpace(tibCount: Space, options?: TransactionOptions): Promise<TransactionResult> {
            if (!isApiReady(this.api)) {
                throw new SDKError('API Client is not ready', 'INVALID_API_CLIENT');
            }
            if (!isKeyringReady(this.keyring)) {
                throw new SDKError('Keyring Pair is required', 'INVALID_KEYRING');
            }
            return sminer.increaseDeclarationSpace(this.api, this.keyring, tibCount, options);
        }

        minerExitPrep(options?: TransactionOptions): Promise<TransactionResult> {
            if (!isApiReady(this.api)) {
                throw new SDKError('API Client is not ready', 'INVALID_API_CLIENT');
            }
            if (!isKeyringReady(this.keyring)) {
                throw new SDKError('Keyring Pair is required', 'INVALID_KEYRING');
            }
            return sminer.minerExitPrep(this.api, this.keyring, options);
        }

        minerWithdraw(options?: TransactionOptions): Promise<TransactionResult> {
            if (!isApiReady(this.api)) {
                throw new SDKError('API Client is not ready', 'INVALID_API_CLIENT');
            }
            if (!isKeyringReady(this.keyring)) {
                throw new SDKError('Keyring Pair is required', 'INVALID_KEYRING');
            }
            return sminer.minerWithdraw(this.api, this.keyring, options);
        }

        receiveReward(options?: TransactionOptions): Promise<TransactionResult> {
            if (!isApiReady(this.api)) {
                throw new SDKError('API Client is not ready', 'INVALID_API_CLIENT');
            }
            if (!isKeyringReady(this.keyring)) {
                throw new SDKError('Keyring Pair is required', 'INVALID_KEYRING');
            }
            return sminer.receiveReward(this.api, this.keyring, options);
        }

        registerPoisKey(poisKey: PoISKeyInfo,
                        teeSignWithAcc: TeeSig,
                        teeSign: TeeSig,
                        teePuk: TeeWorkerPublicKey,
                        options?: TransactionOptions): Promise<TransactionResult> {
            if (!isApiReady(this.api)) {
                throw new SDKError('API Client is not ready', 'INVALID_API_CLIENT');
            }
            if (!isKeyringReady(this.keyring)) {
                throw new SDKError('Keyring Pair is required', 'INVALID_KEYRING');
            }
            return sminer.registerPoisKey(this.api, this.keyring, poisKey, teeSignWithAcc, teeSign, teePuk, options);
        }

        regnstkSminer(
            earningAcc: AccountIdInput,
            endpoint: string,
            staking: BalanceInput,
            tibCount: Space,
            options?: TransactionOptions
        ): Promise<TransactionResult> {
            if (!isApiReady(this.api)) {
                throw new SDKError('API Client is not ready', 'INVALID_API_CLIENT');
            }
            if (!isKeyringReady(this.keyring)) {
                throw new SDKError('Keyring Pair is required', 'INVALID_KEYRING');
            }
            return sminer.regnstkSminer(this.api, this.keyring, earningAcc, endpoint, staking, tibCount, options);
        }

        regnstkAssignStaking(
            earningAcc: AccountIdInput,
            endpoint: string,
            stakingAcc: AccountIdInput,
            tibCount: Space,
            options?: TransactionOptions
        ): Promise<TransactionResult> {
            if (!isApiReady(this.api)) {
                throw new SDKError('API Client is not ready', 'INVALID_API_CLIENT');
            }
            if (!isKeyringReady(this.keyring)) {
                throw new SDKError('Keyring Pair is required', 'INVALID_KEYRING');
            }
            return sminer.regnstkAssignStaking(this.api, this.keyring, earningAcc, endpoint, stakingAcc, tibCount, options);
        }

        updateBeneficiary(earningAcc: string, options?: TransactionOptions): Promise<TransactionResult> {
            if (!isApiReady(this.api)) {
                throw new SDKError('API Client is not ready', 'INVALID_API_CLIENT');
            }
            if (!isKeyringReady(this.keyring)) {
                throw new SDKError('Keyring Pair is required', 'INVALID_KEYRING');
            }
            return sminer.updateBeneficiary(this.api, this.keyring, earningAcc, options);
        }

        updateSminerEndpoint(endpoint: string, options?: TransactionOptions): Promise<TransactionResult> {
            if (!isApiReady(this.api)) {
                throw new SDKError('API Client is not ready', 'INVALID_API_CLIENT');
            }
            if (!isKeyringReady(this.keyring)) {
                throw new SDKError('Keyring Pair is required', 'INVALID_KEYRING');
            }
            return sminer.updateSminerEndpoint(this.api, this.keyring, endpoint, options);
        }
    }
}