import { AccountId } from "@polkadot/types/interfaces";
import {
    AccountIdInput,
    BlockNumberInput, EraInput,
    PagedExposureMetadata, PagedExposureMetadataDetail, StakeOnEra, StakingActiveEraInfo, StakingBounded, StakingEraRewardPoint,
    StakingEraRewardPointDetail, StakingExposure, StakingExposureDetail, StakingExposurePaged, StakingExposurePagedDetail,
    StakingLedger, StakingLedgerDetail, StakingNomination, StakingNominationDetail, StakingValidator, StakingValidatorDetail, ValidatorOnEra
} from "@cessnetwork/types";

export interface IStaking {
    queryValidatorAndNominatorTotalCount(block?:BlockNumberInput): Promise<number>;
    queryCurrentValidatorCount(block?: BlockNumberInput): Promise<number>;
    queryTotalStakeByEraNumber(era?: EraInput, block?: BlockNumberInput): Promise<bigint | StakeOnEra[]>;
    queryCurrentEraNumber(block?: BlockNumberInput): Promise<number>;
    queryRewardPointByEraNumber(era?: EraInput, block?: BlockNumberInput): Promise<StakingEraRewardPointDetail[] | StakingEraRewardPoint | null>;
    queryAllBonded(accountId?: AccountIdInput, block?: BlockNumberInput): Promise<StakingBounded[] | AccountId | string>;
    queryValidatorCommission(accountId?: AccountIdInput, block?: BlockNumberInput): Promise<StakingValidator | StakingValidatorDetail[] | null>;
    queryValidatorRewardByEraNumber(era?: EraInput, block?: BlockNumberInput): Promise<bigint | ValidatorOnEra[] | null>;
    queryLedger(accountId?: AccountIdInput, block?: BlockNumberInput): Promise<StakingLedger | StakingLedgerDetail[] | null>;
    queryStakeByEraNumber(era: EraInput, accountId?: AccountIdInput, block?: BlockNumberInput): Promise<StakingExposure | StakingExposureDetail[] | null>;
    queryAllErasStakePaged(era: EraInput, accountId: AccountIdInput, pageIndex?: number, block?: BlockNumberInput): Promise<StakingExposurePaged | StakingExposurePagedDetail[] | null>;
    queryStakeOverviewByEra(era: EraInput, accountId?: AccountIdInput, block?: BlockNumberInput): Promise<PagedExposureMetadata | PagedExposureMetadataDetail[] | null>;
    queryNominator(accountId?: AccountIdInput, block?: BlockNumberInput): Promise<StakingNomination | StakingNominationDetail[] | null>;
    queryMinimumActiveStake(block?: BlockNumberInput): Promise<bigint>
    queryMinimumValidatorCount(block?: BlockNumberInput): Promise<number>
    queryActiveEra(block?: BlockNumberInput): Promise<StakingActiveEraInfo>
    queryCanceledSlashPayout(block?: BlockNumberInput): Promise<bigint>
    queryClaimedRewards(era: EraInput, accountId: AccountIdInput, block?: BlockNumberInput): Promise<bigint[]>
    queryCurrentPlannedSession(block?: BlockNumberInput): Promise<number>
    queryDisabledValidators(block?: BlockNumberInput): Promise<number[]>
}
