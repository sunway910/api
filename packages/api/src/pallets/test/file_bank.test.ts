import { CESS, CESSConfig } from "@/cess";
import { TransactionOptions } from "@/utils/tx";
import { decodeAddress } from "@polkadot/keyring";
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

        const client = await CESS.newClient(config);
        console.log('Connected to network:', client.getNetworkEnv());
        const accountAddress = client.getSignatureAcc();
        console.log('Account address:', accountAddress);

        if (enableQuery) {
            console.log("\n--- Querying File Bank Pallet using ChainClient methods ---");

            const dealMap = await client.queryDealMap() as any[];
            if (dealMap && dealMap.length > 0) {
                // const firstDeal = dealMap[0];
                const firstDeal = "bae3968f6ada546911eebf17b841c12f2e433cb0f90ab19ea4d7736dff9de2c2";
                console.log('Query Deal Map (first entry):', firstDeal);
                const dealDetails = await client.queryDealMap(firstDeal);
                console.log(`Query Deal Map for hash ${firstDeal}:`, dealDetails);
                console.log(`Query Deal Map for fragmentList ${firstDeal}:`, (dealDetails as any).segmentList[0].fragmentList);
            } else {
                console.log('No deals found in DealMap.');
            }

            const fileMap = await client.queryFileByFid() as any[];
            if (fileMap && fileMap.length > 0) {
                const firstFile = fileMap[0];
                console.log('Query File Map (first entry):', firstFile);
                console.log('Query File Map (first entry) segmentList:', firstFile.fileMetadata.segmentList);
                console.log('Query File Map (first entry) owner:', firstFile.fileMetadata.owner);
                const fileDetails = await client.queryFileByFid(firstFile.fid);
                console.log(`Query File Map for fid ${firstFile.fid}:`, fileDetails);
            } else {
                console.log('No files found in FileMap.');
            }

            const restoralOrders = await client.queryRestoralOrder() as any[];
            if (restoralOrders && restoralOrders.length > 0) {
                console.log('Query Restoral Orders (first entry):', restoralOrders[0]);
            } else {
                console.log('No restoral orders found.');
            }

            const failedCount = await client.queryTaskFailedCount(accountAddress);
            console.log(`Query Task Failed Count for ${accountAddress}:`, failedCount);

            const userFiles = await client.queryUserHoldFileList() as any[];
            if (userFiles && userFiles.length > 0) {
                const userFile = await client.queryUserHoldFileList(userFiles[0].account);
                console.log(`Query User Hold File List for ${userFiles[0].account}:`, userFile);
            }
        }

        if (enableTx) {
            console.log("\n--- Submitting File Bank Transactions using ChainClient methods ---");

            const defaultTxOptions: TransactionOptions = {
                waitForFinalization: true,
                timeout: 120000,
            };

            // Sample data for transactions
            const sampleFileHash = '0x' + 'a'.repeat(64);
            const sampleFragmentHash = '0x' + 'b'.repeat(64);
            const sampleSegments: any[] = [{
                hash: sampleFileHash,
                fragmentList: [sampleFragmentHash]
            }];
            const sampleUserBrief: any = {
                user: accountAddress,
                fileName: "test-file.txt",
                territoryName: "test-bucket"
            };
            const sampleFileSize = 1024;

            // 1. uploadDeclaration
            console.log(`\n1. Testing uploadDeclaration with hash: ${sampleFileHash}`);
            try {
                const result = await client.uploadDeclaration(
                    sampleFileHash,
                    sampleSegments,
                    sampleUserBrief,
                    BigInt(sampleFileSize),
                    defaultTxOptions
                );
                if (result.success) {
                    console.log('✅ Upload declaration successful!', {txHash: result.txHash, blockHash: result.blockHash});
                } else {
                    console.error('❌ Upload declaration failed:', result.error);
                }
            } catch (error) {
                console.error('❌ Error during upload declaration:', error);
            }

            // 2. deleteFile (This will likely fail if the file from uploadDeclaration doesn't exist or has a different owner structure)
            console.log(`\n2. Testing deleteFile with hash: ${sampleFileHash}`);
            try {
                const result = await client.deleteFile(
                    decodeAddress(accountAddress),
                    sampleFileHash,
                    defaultTxOptions
                );
                if (result.success) {
                    console.log('✅ Delete file successful!', {txHash: result.txHash, blockHash: result.blockHash});
                } else {
                    console.error('❌ Delete file failed (may be expected):', result.error);
                }
            } catch (error) {
                console.error('❌ Error during delete file (may be expected):', error);
            }

            // 3. generateRestoralOrder
            console.log(`\n3. Testing generateRestoralOrder for fragment: ${sampleFragmentHash}`);
            try {
                const result = await client.generateRestoralOrder(
                    sampleFileHash,
                    sampleFragmentHash,
                    defaultTxOptions
                );
                if (result.success) {
                    console.log('✅ Generate restoral order successful!', {txHash: result.txHash, blockHash: result.blockHash});
                } else {
                    console.error('❌ Generate restoral order failed (expected without a real file):', result.error);
                }
            } catch (error) {
                console.error('❌ Error during generate restoral order (expected without a real file):', error);
            }

            // 4. claimRestoralOrder
            console.log(`\n4. Testing claimRestoralOrder for fragment: ${sampleFragmentHash}`);
            try {
                const result = await client.claimRestoralOrder(
                    sampleFragmentHash,
                    defaultTxOptions
                );
                if (result.success) {
                    console.log('✅ Claim restoral order successful!', {txHash: result.txHash, blockHash: result.blockHash});
                } else {
                    console.error('❌ Claim restoral order failed (expected without a real order):', result.error);
                }
            } catch (error) {
                console.error('❌ Error during claim restoral order (expected without a real order):', error);
            }

            // 5. restoralOrderComplete
            console.log(`\n5. Testing restoralOrderComplete for fragment: ${sampleFragmentHash}`);
            try {
                const result = await client.restoralOrderComplete(
                    sampleFragmentHash,
                    defaultTxOptions
                );
                if (result.success) {
                    console.log('✅ Restoral order complete successful!', {txHash: result.txHash, blockHash: result.blockHash});
                } else {
                    console.error('❌ Restoral order complete failed (expected without a real claimed order):', result.error);
                }
            } catch (error) {
                console.error('❌ Error during restoral order complete (expected without a real claimed order):', error);
            }

            console.log("\nNOTE: More complex transactions like certIdleSpace, replaceIdleSpace, calculateReport are not included in this test script due to their dependency on TEE signatures and complex data structures.");
        }

        await client.close();
    } catch (error) {
        console.error('Error:', error);
    }
}

main().catch(console.error);
