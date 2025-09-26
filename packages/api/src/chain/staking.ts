import { AccountId } from "@polkadot/types/interfaces";
import {
    AccountIdInput,
    BlockNumberInput, EraInput,
    PagedExposureMetadata,
    PagedExposureMetadataDetail,
    StakeOnEra,
    StakingActiveEraInfo,
    StakingBounded,
    StakingEraRewardPoint,
    StakingEraRewardPointDetail,
    StakingExposure,
    StakingExposureDetail,
    StakingExposurePaged,
    StakingExposurePagedDetail,
    StakingLedger,
    StakingLedgerDetail,
    StakingNomination,
    StakingNominationDetail,
    StakingValidator,
    StakingValidatorDetail,
    ValidatorOnEra
} from "@cessnetwork/types";
import { isApiReady } from "@/utils/tx";
import { SDKError } from "@/utils";
import * as staking from '@/pallets/staking';
import type { Constructor } from "./types";
import { ChainBase } from "./types";

export function Staking<TBase extends Constructor<ChainBase>>(Base: TBase) {
    return class extends Base {
        async queryValidatorAndNominatorTotalCount(block?: BlockNumberInput): Promise<number> {
            if (!isApiReady(this.api)) {
                throw new SDKError('API Client is not ready', 'INVALID_API_CLIENT');
            }
            return staking.queryValidatorAndNominatorTotalCount(this.api, block);
        }

        async queryCurrentValidatorCount(block?: BlockNumberInput): Promise<number> {
            if (!isApiReady(this.api)) {
                throw new SDKError('API Client is not ready', 'INVALID_API_CLIENT');
            }
            return staking.queryCurrentValidatorCount(this.api, block);
        }

        async queryTotalStakeByEraNumber(era?: EraInput, block?: BlockNumberInput): Promise<bigint | StakeOnEra[]> {
            if (!isApiReady(this.api)) {
                throw new SDKError('API Client is not ready', 'INVALID_API_CLIENT');
            }
            return staking.queryTotalStakeByEraNumber(this.api, era, block);
        }

        async queryCurrentEraNumber(block?: BlockNumberInput): Promise<number> {
            if (!isApiReady(this.api)) {
                throw new SDKError('API Client is not ready', 'INVALID_API_CLIENT');
            }
            return staking.queryCurrentEraNumber(this.api, block);
        }

        async queryRewardPointByEraNumber(era?: EraInput, block?: BlockNumberInput): Promise<StakingEraRewardPointDetail[] | StakingEraRewardPoint | null> {
            if (!isApiReady(this.api)) {
                throw new SDKError('API Client is not ready', 'INVALID_API_CLIENT');
            }
            return staking.queryRewardPointByEraNumber(this.api, era, block);
        }

        async queryAllBonded(accountId?: AccountIdInput, block?: BlockNumberInput): Promise<StakingBounded[] | AccountId | string> {
            if (!isApiReady(this.api)) {
                throw new SDKError('API Client is not ready', 'INVALID_API_CLIENT');
            }
            return staking.queryBonded(this.api, accountId, block);
        }

        async queryValidatorCommission(accountId?: AccountIdInput, block?: BlockNumberInput): Promise<StakingValidator | StakingValidatorDetail[] | null> {
            if (!isApiReady(this.api)) {
                throw new SDKError('API Client is not ready', 'INVALID_API_CLIENT');
            }
            return staking.queryValidatorCommission(this.api, accountId, block);
        }

        async queryValidatorRewardByEraNumber(era?: EraInput, block?: BlockNumberInput): Promise<bigint | ValidatorOnEra[] | null> {
            if (!isApiReady(this.api)) {
                throw new SDKError('API Client is not ready', 'INVALID_API_CLIENT');
            }
            return staking.queryValidatorRewardByEraNumber(this.api, era, block);
        }

        async queryLedger(accountId?: AccountIdInput, block?: BlockNumberInput): Promise<StakingLedger | StakingLedgerDetail[] | null> {
            if (!isApiReady(this.api)) {
                throw new SDKError('API Client is not ready', 'INVALID_API_CLIENT');
            }
            return staking.queryLedger(this.api, accountId, block);
        }

        async queryStakeByEraNumber(era: EraInput, accountId?: AccountIdInput, block?: BlockNumberInput): Promise<StakingExposure | StakingExposureDetail[] | null> {
            if (!isApiReady(this.api)) {
                throw new SDKError('API Client is not ready', 'INVALID_API_CLIENT');
            }
            return staking.queryStakerByEraNumber(this.api, era, accountId, block);
        }

        async queryAllErasStakePaged(era: EraInput, accountId: AccountId | string | Uint8Array, pageIndex?: number, block?: BlockNumberInput): Promise<StakingExposurePaged | StakingExposurePagedDetail[] | null> {
            if (!isApiReady(this.api)) {
                throw new SDKError('API Client is not ready', 'INVALID_API_CLIENT');
            }
            return staking.queryAllErasStakerPaged(this.api, era, accountId, pageIndex, block);
        }

        async queryStakeOverviewByEra(era: EraInput, accountId?: AccountIdInput, block?: BlockNumberInput): Promise<PagedExposureMetadata | PagedExposureMetadataDetail[] | null> {
            if (!isApiReady(this.api)) {
                throw new SDKError('API Client is not ready', 'INVALID_API_CLIENT');
            }
            return staking.queryStakerOverviewByEra(this.api, era, accountId, block);
        }

        async queryNominator(accountId?: AccountIdInput, block?: BlockNumberInput): Promise<StakingNomination | StakingNominationDetail[] | null> {
            if (!isApiReady(this.api)) {
                throw new SDKError('API Client is not ready', 'INVALID_API_CLIENT');
            }
            return staking.queryNominator(this.api, accountId, block);
        }

        async queryMinimumActiveStake(block?: BlockNumberInput): Promise<bigint> {
            if (!isApiReady(this.api)) {
                throw new SDKError('API Client is not ready', 'INVALID_API_CLIENT');
            }
            return staking.queryMinimumActiveStake(this.api, block);
        }

        async queryMinimumValidatorCount(block?: BlockNumberInput): Promise<number> {
            if (!isApiReady(this.api)) {
                throw new SDKError('API Client is not ready', 'INVALID_API_CLIENT');
            }
            return staking.queryMinimumValidatorCount(this.api, block);
        }

        async queryActiveEra(block?: BlockNumberInput): Promise<StakingActiveEraInfo> {
            if (!isApiReady(this.api)) {
                throw new SDKError('API Client is not ready', 'INVALID_API_CLIENT');
            }
            return staking.queryActiveEra(this.api, block);
        }

        async queryCanceledSlashPayout(block?: BlockNumberInput): Promise<bigint> {
            if (!isApiReady(this.api)) {
                throw new SDKError('API Client is not ready', 'INVALID_API_CLIENT');
            }
            return staking.queryCanceledSlashPayout(this.api, block);
        }

        async queryClaimedRewards(era: EraInput, accountId: AccountIdInput, block?: BlockNumberInput): Promise<bigint[]> {
            if (!isApiReady(this.api)) {
                throw new SDKError('API Client is not ready', 'INVALID_API_CLIENT');
            }
            return staking.queryClaimedReward(this.api, era, accountId, block);
        }

        async queryCurrentPlannedSession(block?: BlockNumberInput): Promise<number> {
            if (!isApiReady(this.api)) {
                throw new SDKError('API Client is not ready', 'INVALID_API_CLIENT');
            }
            return staking.queryCurrentPlannedSession(this.api, block);
        }

        async queryDisabledValidators(block?: BlockNumberInput): Promise<number[]> {
            if (!isApiReady(this.api)) {
                throw new SDKError('API Client is not ready', 'INVALID_API_CLIENT');
            }
            return staking.queryDisabledValidators(this.api, block);
        }
    }
}