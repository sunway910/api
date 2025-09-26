import { CESS, CESSConfig } from "@/cess";
import { TokenFormatter } from "@cessnetwork/util";
import { TransactionOptions } from "@/utils/tx";
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

        const enableQuery = true;
        const enableTx = false;

        // Instantiate a new client
        const client = await CESS.newClient(config);
        console.log('Connected to network:', client.getNetworkEnv());
        let accountAddress = client.getSignatureAcc();
        console.log('Account address:', accountAddress);
        console.log('Account currentBalance:', TokenFormatter.formatBalance(client.currentBalance, client.tokenDecimals, {
            displayDecimals: 4,
            useGrouping: true,
            symbol: 'CESS'
        }));

        const currentBlock = await client.api!.query.system.number();
        console.log(`Current block: ${currentBlock}`);

        // Test variables
        let testMinerAccount: string | undefined;
        let currentEra: number = 0;

        if (enableQuery) {
            console.log("\n--- Querying Sminer Pallet using ChainClient methods ---");

            // Get a miner account for specific queries
            const allMiners = await client.queryMinerByAccountId() as any[];
            if (allMiners && allMiners.length > 0) {
                testMinerAccount = allMiners[0].account;
                console.log(`Using miner account for tests: ${testMinerAccount}`);
            } else {
                console.log("No miners found, some specific queries will be skipped.");
                testMinerAccount = accountAddress; // Fallback to own address for some tests
            }

            // Get current era for era-specific queries
            try {
                currentEra = await client.queryCurrentEraNumber();
                console.log(`Current era: ${currentEra}`);
            } catch (e) {
                console.log("Could not fetch current era, era-specific tests will be skipped.");
            }

            // 1. queryExpander
            const expanders = await client.queryExpander();
            console.log('Query Expanders result:', expanders);

            // 2. queryMinerByAccountId
            console.log('Query All Miners result (first 2):', allMiners.slice(0, 2));
            if (testMinerAccount) {
                const minerInfo = await client.queryMinerByAccountId(testMinerAccount);
                console.log(`Query Miner Info for ${testMinerAccount} result:`, minerInfo);
            }

            // 3. queryStakingStartBlock
            const allStakingStarts = await client.queryStakingStartBlock() as any[];
            console.log('Query All Staking Start Blocks result (first 2):', allStakingStarts.slice(0, 2));
            if (testMinerAccount) {
                const stakingStart = await client.queryStakingStartBlock(testMinerAccount);
                console.log(`Query Staking Start Block for ${testMinerAccount} result:`, stakingStart);
            }

            // 4. queryAllMiner
            const allMinerAddresses = await client.queryAllMiner();
            console.log('Query All Miner Addresses result (first 5):', allMinerAddresses.slice(0, 5).map(a => a.toString()));

            // 5. queryCounterForMinerItems
            const totalMiners = await client.queryCounterForMinerItems();
            console.log('Query Total Number of Storage Miners result:', totalMiners);

            // 6. queryRewardMapByAccountId
            const allRewardMaps = await client.queryRewardMapByAccountId() as any[];
            console.log('Query All Reward Maps result (first 2):', allRewardMaps.slice(0, 2));
            if (allRewardMaps && allRewardMaps.length >= 1) {
                const rewardMap = await client.queryRewardMapByAccountId(allRewardMaps[0].account);
                console.log(`Query Reward Map for ${allRewardMaps[0].account} result:`, rewardMap);
            }

            // 7. queryMinerLockByAccountId
            if (testMinerAccount) {
                const minerLock = await client.queryMinerLockByAccountId(testMinerAccount);
                console.log(`Query Miner Lock for ${testMinerAccount} result:`, minerLock);
            }

            // 8. queryRestoralTargetByAccountId
            const allRestoralTargets = await client.queryRestoralTargetByAccountId() as any[];
            console.log('Query All Restoral Targets result (first 2):', allRestoralTargets.slice(0, 2));
            if (allRestoralTargets && allRestoralTargets.length >= 1) {
                const restoralTarget = await client.queryRestoralTargetByAccountId(allRestoralTargets[0].accountId);
                console.log(`Query Restoral Target for ${allRestoralTargets[0].accountId} result:`, restoralTarget);
            }

            // 9. queryPendingReplacements
            const allPendingReplacements = await client.queryPendingReplacements() as any[];
            console.log('Query All Pending Replacements result (first 2):', allPendingReplacements.slice(0, 2));
            if (allPendingReplacements && allPendingReplacements.length >= 1) {
                const pendingReplacement = await client.queryPendingReplacements(allPendingReplacements[0].account);
                console.log(`Query Pending Replacements for ${allPendingReplacements[0].account} result:`, pendingReplacement);
            }

            // 10. queryCompleteSnapShot
            if (currentEra > 0) {
                const completeSnapShot = await client.queryCompleteSnapShot(currentEra - 1); // Query previous era
                console.log(`Query Complete SnapShot for era ${currentEra - 1} result:`, completeSnapShot);
            }

            // 11. queryCompleteMinerSnapShot
            const allCompleteMinerSnapShot = await client.queryCompleteMinerSnapShot() as any[];
            console.log(`Query Complete Miner SnapShot result (first 2):`, allCompleteMinerSnapShot.slice(0, 2));

            if (allCompleteMinerSnapShot && allCompleteMinerSnapShot.length > 1) {
                const completeMinerSnapShot = await client.queryCompleteMinerSnapShot(allCompleteMinerSnapShot[1].account);
                console.log(`Query Complete Miner SnapShot for ${allCompleteMinerSnapShot[1].account} result:`, completeMinerSnapShot);
            }
        }

        if (enableTx) {
            const txConfig: CESSConfig = {
                name: "CESS-Pre-MainNet",
                rpcs: ["wss://pm-rpc.cess.network/ws/", "wss://testnet.cess.network/ws/"],
                privateKey: "stadium question example earn window kitchen spin apple select kidney home win",
                ss58Format: 11330,
                enableEventListener: false,
            };
            // Instantiate a new client
            const cli = await CESS.newClient(txConfig);
            if (!cli || !cli.api || !cli.keyring) {
                console.error("Failed to Initialized");
                return;
            }

            console.log("\n--- Submitting Sminer Transactions using ChainClient methods ---");

            const defaultTxOptions: TransactionOptions = {
                waitForFinalization: false,
                timeout: 60000,
                includePaymentInfo: false,
            };
            accountAddress = cli.getSignatureAcc();

            // Dummy data for transactions
            const dummyEndpoint = "1.1.1.1:15001";
            const dummyEndpoint2 = "1.1.1.1:15002";
            const dummyPoisKey: any = {g: "", n: ""};
            const dummyTeeSign = cli.api!.createType('Bytes', '0x' + '00'.repeat(32));

            const masterPubKey = await cli.queryMasterPubKey();
            console.log('Query Master Public Key result:', masterPubKey);
            const dummyTeePuk = masterPubKey?.launched.pubkey;

            // 1. regnstkSminer
            console.log(`\n1. Testing regnstkSminer`);
            try {
                const result = await cli.regnstkSminer(
                    accountAddress, // earningAcc
                    dummyEndpoint,
                    BigInt(4000 * (10 ** 18)), // staking value
                    1, // tibCount
                    defaultTxOptions
                );
                if (result.success) {
                    console.log('✅ regnstkSminer submitted successfully!');
                    console.log('Block hash:', result.blockHash);
                } else {
                    console.error('❌ regnstkSminer failed:', result.error);
                }
            } catch (error) {
                console.error('❌ Error during regnstkSminer:', error);
            }

            // 2. increaseCollateral
            console.log(`\n2. Testing increaseCollateral`);
            try {
                const result = await cli.increaseCollateral(
                    cli.getSignatureAcc(),
                    "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef", // token
                    defaultTxOptions
                );
                if (result.success) {
                    console.log('✅ increaseCollateral submitted successfully!');
                    console.log('Block hash:', result.blockHash);
                } else {
                    console.error('❌ increaseCollateral failed:', result.error);
                }
            } catch (error) {
                console.error('❌ Error during increaseCollateral:', error);
            }

            // 3. increaseDeclarationSpace
            console.log(`\n3. Testing increaseDeclarationSpace`);
            try {
                const result = await cli.increaseDeclarationSpace(
                    1, // tibCount
                    defaultTxOptions
                );
                if (result.success) {
                    console.log('✅ increaseDeclarationSpace submitted successfully!');
                    console.log('Block hash:', result.blockHash);
                } else {
                    console.error('❌ increaseDeclarationSpace failed:', result.error);
                }
            } catch (error) {
                console.error('❌ Error during increaseDeclarationSpace:', error);
            }

            // 4. updateBeneficiary
            console.log(`\n4. Testing updateBeneficiary`);
            try {
                const result = await cli.updateBeneficiary(
                    client.getSignatureAcc(), // new beneficiary
                    defaultTxOptions
                );
                if (result.success) {
                    console.log('✅ updateBeneficiary submitted successfully!');
                    console.log('Block hash:', result.blockHash);
                } else {
                    console.error('❌ updateBeneficiary failed:', result.error);
                }
            } catch (error) {
                console.error('❌ Error during updateBeneficiary:', error);
            }

            // 5. updateSminerEndpoint
            console.log(`\n5. Testing updateSminerEndpoint`);
            try {
                const result = await cli.updateSminerEndpoint(
                    dummyEndpoint2,
                    defaultTxOptions
                );
                if (result.success) {
                    console.log('✅ updateSminerEndpoint submitted successfully!');
                    console.log('Block hash:', result.blockHash);
                } else {
                    console.error('❌ updateSminerEndpoint failed:', result.error);
                }
            } catch (error) {
                console.error('❌ Error during updateSminerEndpoint:', error);
            }

            // 6. receiveReward
            console.log(`\n6. Testing receiveReward`);
            try {
                const result = await cli.receiveReward(defaultTxOptions);
                if (result.success) {
                    console.log('✅ receiveReward submitted successfully!');
                    console.log('Block hash:', result.blockHash);
                } else {
                    console.error('❌ receiveReward failed:', result.error);
                }
            } catch (error) {
                console.error('❌ Error during receiveReward:', error);
            }

            // 7. minerExitPrep
            console.log(`\n7. Testing minerExitPrep`);
            try {
                const result = await cli.minerExitPrep(defaultTxOptions);
                if (result.success) {
                    console.log('✅ minerExitPrep submitted successfully!');
                    console.log('Block hash:', result.blockHash);
                } else {
                    console.error('❌ minerExitPrep failed:', result.error);
                }
            } catch (error) {
                console.error('❌ Error during minerExitPrep:', error);
            }

            // 8. minerWithdraw
            console.log(`\n8. Testing minerWithdraw`);
            try {
                const result = await cli.minerWithdraw(defaultTxOptions);
                if (result.success) {
                    console.log('✅ minerWithdraw submitted successfully!');
                    console.log('Block hash:', result.blockHash);
                } else {
                    console.error('❌ minerWithdraw failed:', result.error);
                }
            } catch (error) {
                console.error('❌ Error during minerWithdraw:', error);
            }

            // The following transactions require complex, valid data and are expected to fail with dummy data.
            console.log(`\n--- Testing functions with dummy data (expected to fail) ---`);

            // 9. registerPoisKey
            console.log(`\n9. Testing registerPoisKey`);
            if (dummyTeePuk) {
                try {
                    const result = await cli.registerPoisKey(
                        dummyPoisKey,
                        dummyTeeSign, // teeSignWithAcc
                        dummyTeeSign, // teeSign
                        dummyTeePuk,
                        defaultTxOptions
                    );
                    if (result.success) {
                        console.log('✅ registerPoisKey submitted successfully!');
                    } else {
                        console.error('❌ registerPoisKey failed (as expected with dummy data):', result.error);
                    }
                } catch (error) {
                    console.error('❌ Error during registerPoisKey (as expected with dummy data):', error);
                }
            }
            // 10. regnstkAssignStaking
            console.log(`\n10. Testing regnstkAssignStaking`);
            try {
                const result = await cli.regnstkAssignStaking(
                    accountAddress, // earnings
                    dummyEndpoint,
                    accountAddress, // stakingAcc
                    1, // tibCount
                    defaultTxOptions
                );
                if (result.success) {
                    console.log('✅ regnstkAssignStaking submitted successfully!');
                } else {
                    console.error('❌ regnstkAssignStaking failed (as expected):', result.error);
                }
            } catch (error) {
                console.error('❌ Error during regnstkAssignStaking (as expected):', error);
            }
            await cli.close();
        }

        await client.close();
    } catch (error) {
        console.error('Error:', error);
    }
}

main().catch(console.error);