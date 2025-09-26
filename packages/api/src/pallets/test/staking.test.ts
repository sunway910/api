import { CESS, CESSConfig } from "@/cess";
import { TokenFormatter } from "@cessnetwork/util";
import { getMnemonic } from "@/test/config";

async function main() {
    try {
        const config: CESSConfig = {
            name: "CESS-Pre-MainNet",
            rpcs: ["wss://pm-rpc.cess.network/ws/", "wss://testnet.cess.network/ws/"],
            privateKey: getMnemonic(),
            ss58Format: 11330,
            enableEventListener: false,
        };

        // Instantiate a new client
        const client = await CESS.newClient(config);
        console.log('Connected to network:', client.getNetworkEnv());
        const accountAddress = client.getSignatureAcc();
        console.log('Account address:', accountAddress);
        console.log('Account currentBalance:', TokenFormatter.formatBalance(client.currentBalance, client.tokenDecimals, {
            displayDecimals: 4,
            useGrouping: true,
            symbol: 'CESS'
        }));

        const currentBlock = await client.api!.query.system.number();
        console.log(`Current block: ${currentBlock}`);

        console.log("\n--- Querying Staking Pallet using ChainClient methods ---");

        // 1. queryValidatorAndNominatorTotalCount
        const totalCount = await client.queryValidatorAndNominatorTotalCount();
        console.log('Query Validator and Nominator Total Count result:', totalCount);

        // 2. queryCurrentValidatorCount
        const validatorCount = await client.queryCurrentValidatorCount();
        console.log('Query Current Validator Count result:', validatorCount);

        // 3. queryCurrentEraNumber
        const currentEra = await client.queryCurrentEraNumber();
        console.log('Query Current Era Number result:', currentEra);

        // 4. queryTotalStakeByEraNumber
        const totalStakeAllEras = await client.queryTotalStakeByEraNumber() as any[];
        console.log('Query Total Stake for All Eras result (first 2):', totalStakeAllEras.slice(0, 2));
        if (currentEra > 0) {
            const totalStakeCurrentEra = await client.queryTotalStakeByEraNumber(currentEra);
            console.log(`Query Total Stake for Current Era (${currentEra}) result:`, totalStakeCurrentEra);
        }

        // 5. queryRewardPointByEraNumber
        const rewardPointsAllEras = await client.queryRewardPointByEraNumber() as any[];
        console.log('Query Reward Points for All Eras result (first 2):', rewardPointsAllEras.slice(0, 2));
        if (currentEra > 0) {
            const rewardPointsCurrentEra = await client.queryRewardPointByEraNumber(currentEra);
            console.log(`Query Reward Points for Current Era (${currentEra}) result:`, rewardPointsCurrentEra);
        }

        // 6. queryBonded
        const allBonded = await client.queryAllBonded() as any[];
        console.log('Query All Bonded result (first 2):', allBonded.slice(0, 2));
        if (allBonded.length > 0) {
            const bondedForAccount = await client.queryAllBonded(allBonded[0].controllerAcc);
            console.log(`Query Bonded for account ${allBonded[0].controllerAcc} result:`, bondedForAccount);
        }

        // 7. queryValidatorCommission
        const allValidators = await client.queryValidatorCommission() as any[];
        console.log('Query All Validator Commissions result (first 2):', allValidators.slice(0, 2));
        if (allValidators.length > 0) {
            const firstValidatorAccount = allValidators[0].account;
            const validatorCommission = await client.queryValidatorCommission(firstValidatorAccount);
            console.log(`Query Validator Commission for ${firstValidatorAccount} result:`, validatorCommission);
        }

        // 8. queryValidatorRewardByEraNumber
        const validatorRewardsAllEras = await client.queryValidatorRewardByEraNumber() as any[];
        console.log('Query Validator Rewards for All Eras result (first 2):', validatorRewardsAllEras.slice(0, 2));
        if (validatorRewardsAllEras.length > 0 && validatorRewardsAllEras[0].era) {
            const validatorRewardCurrentEra = await client.queryValidatorRewardByEraNumber(validatorRewardsAllEras[0].era);
            console.log(`Query Validator Reward for Era ${validatorRewardsAllEras[0].era} result:`, validatorRewardCurrentEra);
        }

        // 9. queryLedger
        const allLedgers = await client.queryLedger() as any[];
        console.log('Query All Ledgers result (first 2):', allLedgers.slice(0, 2));
        if (allLedgers.length > 0) {
            const ledgerForAccount = await client.queryLedger(allLedgers[0].account);
            console.log(`Query Ledger for account ${allLedgers[0].account} result:`, ledgerForAccount);
        }

        // 10. queryStakerByEraNumber
        if (currentEra > 0) {
            const allStakerInEra = await client.queryStakeByEraNumber(currentEra) as any[];
            console.log(`Query All Staker in era ${currentEra} result (first 2):`, allStakerInEra.slice(0, 2));
            if (allStakerInEra.length > 0) {
                const stakersForValidator = await client.queryStakeByEraNumber(currentEra, allStakerInEra[0]?.account);
                console.log(`Query Stakers for ${allStakerInEra[0]?.account} in era ${currentEra} result:`, stakersForValidator);
            }
        }

        // 11. queryAllErasStakerPaged
        const allStakerPaged = await client.queryAllErasStakePaged(50, "cXfFbPCqWUyRW6FBdPcrHaaYhfPNXBUCgsDDp2F6VVBeRTqTH") as any[];
        console.log(`Query All Staker Paged for cXfFbPCqWUyRW6FBdPcrHaaYhfPNXBUCgsDDp2F6VVBeRTqTH in era 50 result (first 1):`, allStakerPaged.slice(0, 1));

        const stakerPaged = await client.queryAllErasStakePaged(50, "cXfFbPCqWUyRW6FBdPcrHaaYhfPNXBUCgsDDp2F6VVBeRTqTH", 0);
        console.log(`Query Staker Paged for cXfFbPCqWUyRW6FBdPcrHaaYhfPNXBUCgsDDp2F6VVBeRTqTH in era 50, page 0 result:`, stakerPaged);

        // 12. queryStakerOverviewByEra
        if (currentEra > 0) {
            const allStakerOverviews = await client.queryStakeOverviewByEra(currentEra) as any[];
            console.log(`Query All Staker Overviews in era ${currentEra} result (first 2):`, allStakerOverviews.slice(0, 2));
            if (allStakerOverviews.length > 0) {
                const stakerOverview = await client.queryStakeOverviewByEra(currentEra, allStakerOverviews[0].account);
                console.log(`Query Staker Overview for ${allStakerOverviews[0].account} in era ${currentEra} result:`, stakerOverview);
            }
        }

        // 13. queryNominator
        const allNominators = await client.queryNominator() as any[];
        if (allNominators.length > 0) {
            console.log('Query All Nominators result (first 2):', allNominators.slice(0, 2));
            const nominatorForAccount = await client.queryNominator(allNominators[0].account);
            console.log(`Query Nominator for account ${allNominators[0].account} result:`, nominatorForAccount);
        }

        // 14. queryMinimumActiveStake
        const minActiveStake = await client.queryMinimumActiveStake();
        console.log('Query Minimum Active Stake result:', minActiveStake?.toString());

        // 15. queryMinimumValidatorCount
        const minValidatorCount = await client.queryMinimumValidatorCount();
        console.log('Query Minimum Validator Count result:', minValidatorCount);

        // 16. queryActiveEra
        const activeEra = await client.queryActiveEra();
        console.log('Query Active Era result:', activeEra);

        // 17. queryCanceledSlashPayout
        const canceledSlashPayout = await client.queryCanceledSlashPayout();
        console.log('Query Canceled Slash Payout result:', canceledSlashPayout.toString());

        // 18. queryClaimedReward
        if (currentEra > 0) {
            const claimedReward = await client.queryClaimedRewards(currentEra, accountAddress);
            console.log(`Query Claimed Reward for account ${accountAddress} in era ${currentEra} result:`, claimedReward);
        }

        // 19. queryCurrentPlannedSession
        const currentPlannedSession = await client.queryCurrentPlannedSession();
        console.log('Query Current Planned Session result:', currentPlannedSession);

        // 20. queryDisabledValidators
        const disabledValidators = await client.queryDisabledValidators();
        console.log('Query Disabled Validators result:', disabledValidators);

        await client.close();
    } catch (error) {
        console.error('Error:', error);
    }
}

main().catch(console.error);
