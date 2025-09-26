// staking.ts
/*
 * Copyright (C) CESS. All rights reserved.
 * Copyright (C) Cumulus Encrypted Storage System. All rights reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import {
    StakingBounded,
    PagedExposureMetadata,
    StakingActiveEraInfo, StakeOnEra, StakingEraRewardPoint,
    StakingEraRewardPointDetail,
    StakingExposure,
    StakingExposurePaged,
    StakingLedger,
    StakingNomination,
    StakingNominationDetail, StakingValidator, StakingValidatorDetail, ValidatorOnEra, StakingLedgerDetail, StakingExposureDetail, PagedExposureMetadataDetail, StakingExposurePagedDetail, BlockNumberInput, EraInput, AccountIdInput,
} from '@cessnetwork/types';
import { ApiPromise } from '@polkadot/api';
import { AccountId } from '@polkadot/types/interfaces';

export async function queryValidatorAndNominatorTotalCount(
    api: ApiPromise,
    block?: BlockNumberInput
): Promise<number> {
    const option = block ? await api.at(await api.rpc.chain.getBlockHash(block)) : api;
    const result = await option.query.staking.counterForValidators();
    if (result.isEmpty) {
        return 0;
    }
    return Number(result.toString());
}

export async function queryCurrentValidatorCount(
    api: ApiPromise,
    block?: BlockNumberInput
): Promise<number> {
    const option = block ? await api.at(await api.rpc.chain.getBlockHash(block)) : api;
    const result = await option.query.staking.validatorCount();
    if (result.isEmpty) {
        return 0;
    }
    return Number(result.toString())
}

export async function queryTotalStakeByEraNumber(
    api: ApiPromise,
    era?: EraInput,
    block?: BlockNumberInput
): Promise<bigint | StakeOnEra[]> {
    const option = block ? await api.at(await api.rpc.chain.getBlockHash(block)) : api;
    if (!era) {
        const result = await option.query.staking.erasTotalStake.entries();
        return result.map(([key, value]) => {
            return {
                eraNumber: Number(key.args[0].toString()),
                stake: BigInt(value.toString())
            } as unknown as StakeOnEra;
        });
    } else {
        const result = await option.query.staking.erasTotalStake(era);
        if (result.isEmpty) {
            return 0n;
        }
        return BigInt(result.toString());
    }
}

export async function queryCurrentEraNumber(
    api: ApiPromise,
    block?: BlockNumberInput
): Promise<number> {
    const option = block ? await api.at(await api.rpc.chain.getBlockHash(block)) : api;
    const result = await option.query.staking.currentEra();
    if (result.isEmpty) {
        return 0;
    }
    return Number(result.toString())
}

export async function queryBonded(
    api: ApiPromise,
    accountId?: AccountIdInput,
    block?: BlockNumberInput
): Promise<StakingBounded[] | AccountId | string> {
    const option = block ? await api.at(await api.rpc.chain.getBlockHash(block)) : api;
    if (accountId) {
        return await option.query.staking.bonded(accountId).then((value) => {
            return value.toString()
        });
    } else {
        const result = await option.query.staking.bonded.entries();
        return result.map(([key, value]) => {
            return {
                controllerAcc: key.args[0].toString(),
                stashAcc: value.toString(),
            } as StakingBounded;
        });
    }
}

export async function queryValidatorRewardByEraNumber(
    api: ApiPromise,
    era?: EraInput,
    block?: BlockNumberInput
): Promise<bigint | ValidatorOnEra[] | null> {
    const option = block ? await api.at(await api.rpc.chain.getBlockHash(block)) : api;
    if (era) {
        const result = await option.query.staking.erasValidatorReward(era);
        if (result.isEmpty) {
            return null;
        }
        return BigInt(result.toString())
    } else {
        const result = await option.query.staking.erasValidatorReward.entries();
        return result.map(([key, value]) => {
            return {
                era: Number(key.args[0].toString()),
                reward: BigInt(value.toString())
            } as unknown as ValidatorOnEra;
        });
    }
}

export async function queryAllErasStakerPaged(
    api: ApiPromise,
    era: EraInput,
    accountId: AccountIdInput,
    pageIndex?: number,
    block?: BlockNumberInput
): Promise<StakingExposurePaged | StakingExposurePagedDetail[] | null> {
    const option = block ? await api.at(await api.rpc.chain.getBlockHash(block)) : api;
    if (pageIndex == undefined) {
        const result = await option.query.staking.erasStakersPaged.entries(era, accountId);
        return result.map(([key, value]) => {
            const pagedData = value.toJSON() as any;
            return {
                era: Number(key.args[0].toString()),
                account: key.args[1].toString(),
                pageIndex: BigInt(key.args[2].toString()),
                stakingExposurePaged: StakingTypeConverter.convertToStakingExposurePaged(pagedData)
            } as unknown as StakingExposurePagedDetail;
        });
    } else {
        const result = await option.query.staking.erasStakersPaged(era, accountId, pageIndex);
        const pagedData = result.toJSON() as any;
        return StakingTypeConverter.convertToStakingExposurePaged(pagedData)
    }
}

export async function queryStakerOverviewByEra(
    api: ApiPromise,
    era: EraInput,
    accountId?: AccountIdInput,
    block?: BlockNumberInput
): Promise<PagedExposureMetadata | PagedExposureMetadataDetail[] | null> {
    const option = block ? await api.at(await api.rpc.chain.getBlockHash(block)) : api;
    if (accountId) {
        const result = await option.query.staking.erasStakersOverview(era, accountId);
        if (result.isEmpty) {
            return null;
        }
        const pagedExposureMetadata = result.toJSON() as any;
        return StakingTypeConverter.convertToPagedExposureMetadata(pagedExposureMetadata)
    } else {
        const result = await option.query.staking.erasStakersOverview.entries();
        return result.map(([key, value]) => {
            const data = value.toJSON() as any;
            return {
                era: Number(key.args[0].toString()),
                account: key.args[1].toString(),
                stakingExposurePaged: StakingTypeConverter.convertToPagedExposureMetadata(data)
            } as unknown as PagedExposureMetadataDetail;
        });
    }
}

export async function queryMinimumActiveStake(
    api: ApiPromise,
    block?: BlockNumberInput
): Promise<bigint> {
    const option = block ? await api.at(await api.rpc.chain.getBlockHash(block)) : api;
    const result = await option.query.staking.minimumActiveStake();
    return BigInt(result.toString())
}

export async function queryMinimumValidatorCount(
    api: ApiPromise,
    block?: BlockNumberInput
): Promise<number> {
    const option = block ? await api.at(await api.rpc.chain.getBlockHash(block)) : api;
    const result = await option.query.staking.minimumValidatorCount();
    return parseInt(result.toString());
}

export async function queryCanceledSlashPayout(
    api: ApiPromise,
    block?: BlockNumberInput
): Promise<bigint> {
    const option = block ? await api.at(await api.rpc.chain.getBlockHash(block)) : api;
    const result = await option.query.staking.canceledSlashPayout();
    return BigInt(result.toString());
}

export async function queryCurrentPlannedSession(
    api: ApiPromise,
    block?: BlockNumberInput
): Promise<number> {
    const option = block ? await api.at(await api.rpc.chain.getBlockHash(block)) : api;
    const result = await option.query.staking.currentPlannedSession();
    return Number(result.toString());
}

export async function queryLedger(
    api: ApiPromise,
    accountId?: AccountIdInput,
    block?: BlockNumberInput
): Promise<StakingLedger | StakingLedgerDetail[] | null> {
    const option = block ? await api.at(await api.rpc.chain.getBlockHash(block)) : api;

    if (accountId) {
        const result = await option.query.staking.ledger(accountId);
        if (result.isEmpty) {
            return null;
        }

        const ledgerData = result.toJSON() as any;
        return StakingTypeConverter.convertToStakingLedger(ledgerData);
    } else {
        const result = await option.query.staking.ledger.entries();
        return result.map(([key, value]) => {
            const ledgerData = value.toJSON() as any;
            return {
                account: key.args[0].toString(),
                stakingLedger: StakingTypeConverter.convertToStakingLedger(ledgerData)
            } as StakingLedgerDetail;
        });
    }
}

export async function queryValidatorCommission(
    api: ApiPromise,
    accountId?: AccountIdInput,
    block?: BlockNumberInput
): Promise<StakingValidator | StakingValidatorDetail[] | null> {
    const option = block ? await api.at(await api.rpc.chain.getBlockHash(block)) : api;

    if (accountId) {
        const result = await option.query.staking.validators(accountId);
        if (result.isEmpty) {
            return null;
        }

        const validatorData = result.toJSON() as any;
        return StakingTypeConverter.convertToStakingValidator(validatorData);
    } else {
        const result = await option.query.staking.validators.entries();
        return result.map(([key, value]) => {
            const validatorData = value.toJSON() as any;
            return {
                account: key.args[0].toString(),
                stakingValidator: StakingTypeConverter.convertToStakingValidator(validatorData)
            } as StakingValidatorDetail;
        });
    }
}

export async function queryRewardPointByEraNumber(
    api: ApiPromise,
    era?: EraInput,
    block?: BlockNumberInput
): Promise<StakingEraRewardPoint | StakingEraRewardPointDetail[] | null> {
    const option = block ? await api.at(await api.rpc.chain.getBlockHash(block)) : api;

    if (!era) {
        const result = await option.query.staking.erasRewardPoints.entries();
        return result.map(([key, value]) => {
            const rewardPoints = value.toJSON() as any;
            return {
                eraNumber: Number(key.args[0].toString()),
                stakingEraRewardPoint: StakingTypeConverter.convertToStakingEraRewardPoint(rewardPoints)
            } as StakingEraRewardPointDetail;
        });
    } else {
        const result = await option.query.staking.erasRewardPoints(era);
        if (result.isEmpty) {
            return null;
        }

        const rewardPoints = result.toJSON() as any;
        return StakingTypeConverter.convertToStakingEraRewardPoint(rewardPoints);
    }
}

export async function queryStakerByEraNumber(
    api: ApiPromise,
    era: EraInput,
    accountId?: AccountIdInput,
    block?: BlockNumberInput
): Promise<StakingExposure | StakingExposureDetail[] | null> {
    const option = block ? await api.at(await api.rpc.chain.getBlockHash(block)) : api;

    if (accountId) {
        const result = await option.query.staking.erasStakers(era, accountId);
        if (result.isEmpty) {
            return null;
        }

        const exposureData = result.toJSON() as any;
        return StakingTypeConverter.convertToStakingExposure(exposureData);
    } else {
        const result = await option.query.staking.erasStakers.entries();
        return result.map(([key, value]) => {
            const exposureData = value.toJSON() as any;
            return {
                account: key.args[1].toString(),
                stakingExposure: StakingTypeConverter.convertToStakingExposure(exposureData)
            } as StakingExposureDetail;
        });
    }
}

export async function queryNominator(
    api: ApiPromise,
    accountId?: AccountIdInput,
    block?: BlockNumberInput
): Promise<StakingNomination | StakingNominationDetail[] | null> {
    const option = block ? await api.at(await api.rpc.chain.getBlockHash(block)) : api;

    if (!accountId) {
        const result = await option.query.staking.nominators.entries();
        return result.map(([key, value]) => {
            const nominationData = value.toJSON() as any;
            return {
                account: key.args[0].toString(),
                stakingNomination: StakingTypeConverter.convertToStakingNomination(nominationData)
            } as StakingNominationDetail;
        });
    } else {
        const result = await option.query.staking.nominators(accountId);
        if (result.isEmpty) {
            return null;
        }

        const nominationData = result.toJSON() as any;
        return StakingTypeConverter.convertToStakingNomination(nominationData);
    }
}

export async function queryActiveEra(
    api: ApiPromise,
    block?: BlockNumberInput
): Promise<StakingActiveEraInfo> {
    const option = block ? await api.at(await api.rpc.chain.getBlockHash(block)) : api;
    const result = await option.query.staking.activeEra();

    const activeEraData = result.toJSON() as any;
    return StakingTypeConverter.convertToStakingActiveEraInfo(activeEraData);
}

export async function queryClaimedReward(
    api: ApiPromise,
    era: EraInput,
    accountId: AccountIdInput,
    block?: BlockNumberInput
): Promise<bigint[]> {
    const option = block ? await api.at(await api.rpc.chain.getBlockHash(block)) : api;
    const result = await option.query.staking.claimedRewards(era, accountId);

    const rewardsData = result.toJSON() as any[];
    return StakingTypeConverter.convertToBigIntArray(rewardsData);
}

export async function queryDisabledValidators(
    api: ApiPromise,
    block?: BlockNumberInput
): Promise<number[]> {
    const option = block ? await api.at(await api.rpc.chain.getBlockHash(block)) : api;
    const result = await option.query.staking.disabledValidators();

    const validatorsData = result.toJSON() as any[];
    return StakingTypeConverter.convertToNumberArray(validatorsData);
}


/**
 * Generic type conversion utilities for staking data
 */
export class StakingTypeConverter {
    /**
     * Convert raw ledger data to StakingLedger type
     */
    static convertToStakingLedger(ledgerData: any): StakingLedger {
        return {
            stash: ledgerData.stash,
            total: BigInt(ledgerData.total),
            active: BigInt(ledgerData.active),
            unlocking: (ledgerData.unlocking || []).map((chunk: any) => ({
                value: BigInt(chunk.value),
                era: Number(chunk.era.toString())
            })),
            legacyClaimedRewards: (ledgerData.legacyClaimedRewards || []).map((reward: any) => BigInt(reward))
        };
    }

    /**
     * Convert raw validator data to StakingValidator type
     */
    static convertToStakingValidator(validatorData: any): StakingValidator {
        return {
            commission: validatorData.commission.toString(),
            blocked: validatorData.blocked || false
        };
    }

    /**
     * Convert raw exposure data to StakingExposure type
     */
    static convertToStakingExposure(exposureData: any): StakingExposure {
        return {
            total: BigInt(exposureData.total),
            own: BigInt(exposureData.own),
            others: (exposureData.others || []).map((nominator: any) => ({
                who: nominator.who,
                value: BigInt(nominator.value)
            }))
        };
    }

    /**
     * Convert raw nomination data to StakingNomination type
     */
    static convertToStakingNomination(nominationData: any): StakingNomination {
        return {
            targets: nominationData.targets || [],
            submittedIn: Number(nominationData.submittedIn || 0),
            suppressed: Boolean(nominationData.suppressed || false)
        };
    }

    /**
     * Convert raw reward points data to StakingEraRewardPoint type
     */
    static convertToStakingEraRewardPoint(rewardPoints: any): StakingEraRewardPoint {
        return {
            total: BigInt(rewardPoints.total),
            individual: Object.entries(rewardPoints.individual || {}).map(([acc, reward]) => ({
                acc: acc as string,
                reward: BigInt(reward as string)
            }))
        };
    }

    /**
     * Convert raw exposure paged data to StakingExposurePaged type
     */
    static convertToStakingExposurePaged(pagedData: any): StakingExposurePaged {
        return {
            pageTotal: BigInt(pagedData.pageTotal || 0),
            others: (pagedData.others || []).map((nominator: any) => ({
                who: nominator.who,
                value: BigInt(nominator.value)
            }))
        };
    }

    /**
     * Convert raw paged exposure metadata to PagedExposureMetadata type
     */
    static convertToPagedExposureMetadata(data: any): PagedExposureMetadata {
        return {
            total: BigInt(data.total),
            own: BigInt(data.own),
            nominatorCount: Number(data.nominatorCount),
            pageCount: BigInt(data.pageCount)
        };
    }

    /**
     * Convert raw active era data to StakingActiveEraInfo type
     */
    static convertToStakingActiveEraInfo(activeEraData: any): StakingActiveEraInfo {
        return {
            index: Number(activeEraData.index || 0),
            start: activeEraData.start ? Number(activeEraData.start) : 0
        };
    }

    /**
     * Generic converter for arrays with BigInt conversion
     */
    static convertToBigIntArray(data: any[]): bigint[] {
        return data.map(item => BigInt(item));
    }

    /**
     * Generic converter for arrays with Number conversion
     */
    static convertToNumberArray(data: any[]): number[] {
        return data.map(item => Number(item));
    }
}