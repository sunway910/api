import { CESS, CESSConfig } from "@/cess";
import { TransactionOptions } from "@/utils/tx";
import { decodeAddress } from "@polkadot/keyring";
import { getMnemonic } from "@/test/config";
import { TokenFormatter, SpaceFormatter } from "@cessnetwork/util";

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
        const accountAddress = client.getSignatureAcc();
        console.log('Account address:', accountAddress);
        console.log('Account currentBalance:', TokenFormatter.formatBalance(client.currentBalance, client.tokenDecimals, {
            displayDecimals: 4,
            useGrouping: true,
            symbol: 'CESS'
        }));

        const currentBlock = await client.api!.query.system.number();
        console.log(`Current block : ${currentBlock}`);

        // Test variables
        const territoryNameForMint = "TestTerritory" + Date.now();
        const sampleToken = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
        const oldBlock = parseInt(currentBlock.toString());
        const expiredAfterMinutes = 10;
        const newBlock = parseInt(currentBlock.toString()) + 100;

        const balanceFormat = (value: any) => TokenFormatter.formatBalance(value.toString(), client.tokenDecimals, {
            displayDecimals: 4,
            useGrouping: false,
            symbol: ''
        });

        const spaceFormat = (value: any) => SpaceFormatter.formatBytes(value.toString());

        if (enableQuery) {
            console.log("\n--- Querying Storage Handler Pallet using ChainClient methods ---");

            // 1. queryUnitPrice
            const unitPrice = await client.queryUnitPrice();
            console.log('Query Unit Price result:', balanceFormat(unitPrice));

            // 2. queryTotalIdleSpace
            const totalIdleSpace = await client.queryTotalIdleSpace();
            console.log('Query Total Idle Space result:', spaceFormat(totalIdleSpace.toString()));

            // 3. queryTotalServiceSpace
            const totalServiceSpace = await client.queryTotalServiceSpace();
            console.log('Query Total Service Space result:', spaceFormat(totalServiceSpace.toString()));

            // 4. queryPurchasedSpace
            const purchasedSpace = await client.queryPurchasedSpace();
            console.log('Query Purchased Space result:', spaceFormat(purchasedSpace.toString()));

            // 5. queryPayOrder (with null hash, as it might require a valid order hash)
            const payOrderList = await client.queryPayOrder() as any[];
            if (payOrderList && payOrderList.length > 0) {
                console.log('Query Pay Order (with null hash) result:', payOrderList[payOrderList.length - 1]);
                const payOrderDetail = await client.queryPayOrder(payOrderList[0].orderId);
                console.log(`Query Pay Order for order id '${payOrderList[0].orderId}' result:`, payOrderDetail);
            }

            // 6. queryTerritory (with a sample name, likely to be null)
            const territoryInfo = await client.queryTerritory(accountAddress) as any[];
            if (territoryInfo && territoryInfo.length > 0) {
                console.log(`Query Territory for account ${accountAddress} result:`, territoryInfo[territoryInfo.length - 1]);
                const territoryDetail = await client.queryTerritory(accountAddress, territoryInfo[0].name);
                console.log(`Query Territory '${territoryInfo[0].name}' for account ${accountAddress} result:`, territoryDetail);
            }

            // 7. queryConsignment (with a dummy hash, likely to be null)
            const consignmentList = await client.queryConsignment() as any[];
            if (consignmentList && consignmentList.length > 0) {
                console.log(`Query Consignment result:`, consignmentList[consignmentList.length - 1]);
                const consignmentDetail = await client.queryConsignment(consignmentList[0].token);
                console.log(`Query Consignment for token ${consignmentList[0].token} result:`, consignmentDetail);
            }
        }

        if (enableTx) {
            console.log("\n--- Submitting Storage Handler Transactions using ChainClient methods ---");

            // Common transaction options
            const defaultTxOptions: TransactionOptions = {
                waitForFinalization: false,
                timeout: 30000,
                includePaymentInfo: false,
                tip: 1,
            };

            // Test variables
            let territoryToken
            const consignment = await client.queryConsignment() as any[];
            let testConsignmentToken = consignment[0].token;
            let NewTerritoryNameAfterBuyConsignment = "NewTerritoryNameAfterBuyConsignment" + Date.now();
            const territory = await client.queryTerritory(accountAddress) as any[];
            const newTerritoryName = "RenamedTerritory" + Date.now();
            console.log(`\n🚀 Starting transaction tests...`);

            // 1. mintTerritory - Create a new territory
            console.log(`\n1. Testing mintTerritory with name: ${territoryNameForMint}`);
            try {
                const result = await client.mintTerritory(
                    1, // gibCount
                    territoryNameForMint,
                    30, // days
                );

                if (result.success) {
                    console.log('✅ Territory minted successfully!');
                    console.log('Block hash:', result.blockHash);
                    console.log('Transaction hash:', result.txHash);

                    // Wait and query the minted territory
                    console.log('Waiting 8 seconds before querying territory...');
                    await new Promise(resolve => setTimeout(resolve, 8000));

                    const territory = await client.queryTerritory(accountAddress, territoryNameForMint) as any;
                    console.log('Territory details:', territory);
                    territoryToken = territory?.token
                    console.log('Territory Token:', territoryToken);
                } else {
                    console.error('❌ Territory minting failed:', result.error);
                }
            } catch (error) {
                console.error('❌ Error during territory minting:', error);
            }

            // 2. expandingTerritory - Expand existing territory
            console.log(`\n2. Testing expandingTerritory for: ${territoryNameForMint}`);
            try {
                const result = await client.expandingTerritory(
                    territoryNameForMint,
                    1, // additional gibCount
                );

                if (result.success) {
                    console.log('✅ Territory expanded successfully!');
                    console.log('Block hash:', result.blockHash);
                } else {
                    console.error('❌ Territory expansion failed:', result.error);
                }
            } catch (error) {
                console.error('❌ Error during territory expansion:', error);
            }

            // 3. renewalTerritory - Renew territory
            console.log(`\n3. Testing renewalTerritory for: ${territoryNameForMint}`);
            try {
                const result = await client.renewalTerritory(
                    territoryNameForMint,
                    15, // additional days
                );

                if (result.success) {
                    console.log('✅ Territory renewed successfully!');
                    console.log('Block hash:', result.blockHash);
                } else {
                    console.error('❌ Territory renewal failed:', result.error);
                }
            } catch (error) {
                console.error('❌ Error during territory renewal:', error);
            }

            // 4. territoryRename - Rename territory
            console.log(`\n4. Testing territoryRename from ${territoryNameForMint} to ${newTerritoryName}`);
            try {
                const result = await client.territoryRename(
                    territoryNameForMint,
                    newTerritoryName,
                );

                if (result.success) {
                    console.log('✅ Territory renamed successfully!');
                    console.log('Block hash:', result.blockHash);
                } else {
                    console.error('❌ Territory rename failed:', result.error);
                }
            } catch (error) {
                console.error('❌ Error during territory rename:', error);
            }

            // 5. territoryConsignment - Put territory up for consignment
            console.log(`\n5. Testing territoryConsignment for: ${newTerritoryName}`);
            try {
                const result = await client.territoryConsignment(
                    newTerritoryName,
                    "999",
                );

                if (result.success) {
                    console.log('✅ Territory consignment created successfully!');
                    console.log('Block hash:', result.blockHash);
                } else {
                    console.error('❌ Territory consignment failed:', result.error);
                }
            } catch (error) {
                console.error('❌ Error during territory consignment:', error);
            }

            // 6. cancelConsignment - Cancel consignment
            console.log(`\n6. Testing cancelConsignment for: ${newTerritoryName}`);
            try {
                const result = await client.cancelConsignment(
                    newTerritoryName,
                );

                if (result.success) {
                    console.log('✅ Territory consignment cancelled successfully!');
                    console.log('Block hash:', result.blockHash);
                } else {
                    console.error('❌ Territory consignment cancellation failed:', result.error);
                }
            } catch (error) {
                console.error('❌ Error during consignment cancellation:', error);
            }

            // 7. territoryGrants - Grant territory permissions
            console.log(`\n7. Testing territoryGrants for: ${newTerritoryName}`);
            try {
                const result = await client.territoryGrants(
                    newTerritoryName,
                    "cXiHhxQmG5sVQsiYD3hyRzwvJxPqAaNcGdtikbkcfJsX9eMFP",
                );

                if (result.success) {
                    console.log('✅ Territory grants updated successfully!');
                    console.log('Block hash:', result.blockHash);
                } else {
                    console.error('❌ Territory grants failed:', result.error);
                }
            } catch (error) {
                console.error('❌ Error during territory grants:', error);
            }

            // 8. reactivateTerritory - Reactivate territory
            console.log(`\n8. Testing reactivateTerritory for: ${newTerritoryName}`);
            try {
                const result = await client.reactivateTerritory(
                    territory[territory.length - 1].name,
                    7, // days
                );

                if (result.success) {
                    console.log('✅ Territory reactivated successfully!');
                    console.log('Block hash:', result.blockHash);
                } else {
                    console.error('❌ Territory reactivation failed:', result.error);
                }
            } catch (error) {
                console.error('❌ Error during territory reactivation:', error);
            }

            // 9. createOrder - Create an order
            console.log(`\n9. Testing createOrder`);
            try {
                const result = await client.createOrder(
                    decodeAddress(accountAddress), // targetAcc
                    newTerritoryName,
                    "Buy", // orderType
                    1, // gibCount
                    3, // days
                    expiredAfterMinutes,
                );

                if (result.success) {
                    console.log('✅ Order created successfully!');
                    console.log('Block hash:', result.blockHash);
                } else {
                    console.error('❌ Order creation failed:', result.error);
                }
            } catch (error) {
                console.error('❌ Error during order creation:', error);
            }

            // 10. clearServiceSpace - Clear service space
            console.log(`\n10. Testing clearServiceSpace`);
            try {
                const result = await client.clearServiceSpace();
                if (result.success) {
                    console.log('✅ Service space cleared successfully!');
                    console.log('Block hash:', result.blockHash);
                } else {
                    console.error('❌ Service space clearing failed:', result.error);
                }
            } catch (error) {
                console.error('❌ Error during service space clearing:', error);
            }

            // 11. updatePrice - Update price (admin function)
            console.log(`\n11. Testing updatePrice`);
            try {
                const result = await client.updatePrice();
                if (result.success) {
                    console.log('✅ Price updated successfully!');
                    console.log('Block hash:', result.blockHash);
                } else {
                    console.error('❌ Price update failed:', result.error);
                }
            } catch (error) {
                console.error('❌ Error during price update:', error);
            }

            // Test functions that require specific tokens/hashes (these might fail due to invalid data)
            console.log(`\n--- Testing functions with sample data (may fail with invalid data) ---`);

            // 12. buyConsignment - Buy a consignment (requires valid token)
            console.log(`\n12. Testing buyConsignment with sample token`);

            if (consignment.length <= 0) {
                console.log('No consignment found, skipping test')
                return
            }
            try {
                const result = await client.buyConsignment(
                    testConsignmentToken,
                    NewTerritoryNameAfterBuyConsignment,
                );

                if (result.success) {
                    console.log('✅ Consignment bought successfully!');
                    console.log('tx hash:', result.txHash);
                    console.log('Block hash:', result.blockHash);
                } else {
                    console.error('❌ Consignment purchase failed (expected with sample data):', result.error);
                }
            } catch (error) {
                console.error('❌ Error during consignment purchase (expected with sample data):', error);
            }

            // 13. cancelPurchaseAction - Cancel purchase action
            console.log(`\n13. Testing cancelPurchaseAction with sample token`);
            try {
                const result = await client.cancelPurchaseAction(
                    testConsignmentToken,
                );

                if (result.success) {
                    console.log('✅ Purchase action cancelled successfully!');
                    console.log('Block hash:', result.blockHash);
                } else {
                    console.error('❌ Purchase action cancellation failed (expected with sample data):', result.error);
                }
            } catch (error) {
                console.error('❌ Error during purchase action cancellation (expected with sample data):', error);
            }

            // 14. execOrder - Execute order
            console.log(`\n14. Testing execOrder with sample order ID`);
            try {
                const order = await client.queryPayOrder() as any[];
                let testOrderId = order[order.length - 1].orderId;
                const result = await client.execOrder(
                    testOrderId,
                );

                if (result.success) {
                    console.log('✅ Order executed successfully!');
                    console.log('Block hash:', result.blockHash);
                } else {
                    console.error('❌ Order execution failed (expected with sample data):', result.error);
                }
            } catch (error) {
                console.error('❌ Error during order execution (expected with sample data):', error);
            }

            // 15. defineUpdatePrice - Define update price (admin function)
            console.log(`\n15. Testing defineUpdatePrice`);
            try {
                const result = await client.defineUpdatePrice(
                    "1000000", // price in smallest unit
                );

                if (result.success) {
                    console.log('✅ Update price defined successfully!');
                    console.log('Block hash:', result.blockHash);
                } else {
                    console.error('❌ Define update price failed:', result.error);
                }
            } catch (error) {
                console.error('❌ Error during define update price:', error);
            }

            // Advanced functions (likely to fail without proper setup)
            console.log(`\n--- Testing advanced functions (likely to fail without proper setup) ---`);

            // 16. otherReactivateTerritory - Reactivate someone else's territory
            console.log(`\n16. Testing otherReactivateTerritory`);
            for (let i = 0; i < territory.length - 1; i++) {
                if (territory[i].name == territory[0].name) {
                    console.log(`territory[0].name: `, territory[0].name);
                    break
                }
            }
            try {
                const result = await client.otherReactivateTerritory(
                    accountAddress, // targetAcc
                    territory[0].name, // target account's territory name
                    7, // days
                );

                if (result.success) {
                    console.log('✅ Other territory reactivated successfully!');
                    console.log('Block hash:', result.blockHash);
                } else {
                    console.error('❌ Other territory reactivation failed:', result.error);
                }
            } catch (error) {
                console.error('❌ Error during other territory reactivation:', error);
            }

            // 17. fixTerritorySpaceForReactivate - Fix territory space for reactivation
            console.log(`\n17. Testing fixTerritorySpaceForReactivate`);
            try {
                const result = await client.fixTerritorySpaceForReactivate(
                    accountAddress,
                    newTerritoryName,
                );

                if (result.success) {
                    console.log('✅ Territory space fixed for reactivation successfully!');
                    console.log('Block hash:', result.blockHash);
                } else {
                    console.error('❌ Territory space fix failed:', result.error);
                }
            } catch (error) {
                console.error('❌ Error during territory space fix:', error);
            }

            // 18. updateUserTerritoryLife - Update user territory life (admin function)
            console.log(`\n18. Testing updateUserTerritoryLife`);
            try {
                const result = await client.updateUserTerritoryLife(
                    decodeAddress(accountAddress),
                    newTerritoryName,
                    currentBlock.toString(),
                );

                if (result.success) {
                    console.log('✅ User territory life updated successfully!');
                    console.log('Block hash:', result.blockHash);
                } else {
                    console.error('❌ User territory life update failed:', result.error);
                }
            } catch (error) {
                console.error('❌ Error during user territory life update:', error);
            }

            // 19. execConsignment - Execute consignment
            console.log(`\n19. Testing execConsignment`);
            try {
                const result = await client.execConsignment(
                    sampleToken,
                    newTerritoryName,
                );

                if (result.success) {
                    console.log('✅ Consignment executed successfully!');
                    console.log('Block hash:', result.blockHash);
                } else {
                    console.error('❌ Consignment execution failed (expected with sample data):', result.error);
                }
            } catch (error) {
                console.error('❌ Error during consignment execution (expected with sample data):', error);
            }

            // 20. updateExpiredExec - Update expired execution
            console.log(`\n20. Testing updateExpiredExec`);
            try {
                const result = await client.updateExpiredExec(
                    oldBlock, // oldBlock
                    newBlock, // newBlock
                    sampleToken,
                );

                if (result.success) {
                    console.log('✅ Expired execution updated successfully!');
                    console.log('Block hash:', result.blockHash);
                } else {
                    console.error('❌ Expired execution update failed (expected with sample data):', result.error);
                }
            } catch (error) {
                console.error('❌ Error during expired execution update (expected with sample data):', error);
            }

            console.log(`\n🏁 Transaction testing completed!`);
        }

        await client.close();
    } catch (error) {
        console.error('Error:', error);
    }
}

main().catch(console.error);