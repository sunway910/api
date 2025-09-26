import { CESS, CESSConfig } from "@/cess";
import { ChallengeInfo } from '@cessnetwork/types';
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

        const client = await CESS.newClient(config);
        console.log('Connected to network:', client.getNetworkEnv());
        const accountAddress = client.getSignatureAcc();
        console.log('Account address:', accountAddress);

        if (enableQuery) {
            console.log("\n--- Querying Audit Pallet using ChainClient methods ---");

            const challengeSnapShot = await client.queryChallengeSnapShot(accountAddress) as ChallengeInfo;
            console.log(`Query Challenge SnapShot for ${accountAddress}:`, challengeSnapShot);

            const countedClear = await client.queryCountedClear(accountAddress);
            console.log(`Query Counted Clear for ${accountAddress}:`, countedClear);

            const serviceFailed = await client.queryCountedServiceFailed(accountAddress);
            console.log(`Query Counted Service Failed for ${accountAddress}:`, serviceFailed);
        }

        if (enableTx) {
            console.log("\n--- Submitting Audit Transactions using ChainClient methods ---");

            const defaultTxOptions: TransactionOptions = {
                waitForFinalization: true,
                timeout: 120000,
            };

            // 1. updateCountedClear (This is likely a privileged extrinsic)
            console.log(`\n1. Testing updateCountedClear for account: ${accountAddress}`);
            try {
                const result = await client.updateCountedClear(accountAddress, defaultTxOptions);
                if (result.success) {
                    console.log('✅ updateCountedClear successful!', {txHash: result.txHash, blockHash: result.blockHash});
                } else {
                    console.error('❌ updateCountedClear failed (may be expected due to permissions):', result.error);
                }
            } catch (error) {
                console.error('❌ Error during updateCountedClear (may be expected due to permissions):', error);
            }

            // --- Complex Transactions with Placeholder Data ---
            console.log("\n--- Testing complex transactions with placeholder data (failures are expected) ---");

            // 2. submitIdleProof
            console.log(`\n2. Testing submitIdleProof`);
            try {
                const sampleProof = new Uint8Array(66).fill(1); // 32 bytes of dummy data
                const result = await client.submitIdleProof(sampleProof, defaultTxOptions);
                if (result.success) {
                    console.log('✅ submitIdleProof successful!', {txHash: result.txHash, blockHash: result.blockHash});
                } else {
                    console.error('❌ submitIdleProof failed (expected):', result.error);
                }
            } catch (error) {
                console.error('❌ Error during submitIdleProof (expected):', error);
            }

            // 3. submitServiceProof
            console.log(`\n3. Testing submitServiceProof`);
            try {
                const sampleProof = new Uint8Array(8421508).fill(2); // 32 bytes of dummy data
                const result = await client.submitServiceProof(sampleProof, defaultTxOptions);
                if (result.success) {
                    console.log('✅ submitServiceProof successful!', {txHash: result.txHash, blockHash: result.blockHash});
                } else {
                    console.error('❌ submitServiceProof failed (expected):', result.error);
                }
            } catch (error) {
                console.error('❌ Error during submitServiceProof (expected):', error);
            }

            // 4. submitVerifyIdleResult
            console.log(`\n4. Testing submitVerifyIdleResult`);
            try {
                const sampleTotalProofHash = new Uint8Array(10485760).fill(1);
                const sampleFront = client.api!.createType('u64', 1);
                const sampleRear = client.api!.createType('u64', 100);
                const sampleAccumulator = '0x' + 'c'.repeat(512);
                const sampleResult = true;
                const sampleSig = new Uint8Array(64).fill(4).toString();
                const sampleTeePuk = '0x' + 'd'.repeat(64);

                const result = await client.submitVerifyIdleResult(
                    sampleTotalProofHash, sampleFront, sampleRear,
                    sampleAccumulator, sampleResult, sampleSig, sampleTeePuk, defaultTxOptions
                );
                if (result.success) {
                    console.log('✅ submitVerifyIdleResult successful!', {txHash: result.txHash, blockHash: result.blockHash});
                } else {
                    console.error('❌ submitVerifyIdleResult failed (expected):', result.error);
                }
            } catch (error) {
                console.error('❌ Error during submitVerifyIdleResult (expected):', error);
            }

            // 5. submitVerifyServiceResult
            console.log(`\n5. Testing submitVerifyServiceResult`);
            try {
                const sampleResult = true;
                const sampleSign = new Uint8Array(64).fill(5).toString();
                const sampleBloomFilter = new Array(256).fill(0n) as any;
                const sampleTeePuk = '0x' + 'e'.repeat(64).toString();

                const result = await client.submitVerifyServiceResult(
                    sampleResult, sampleSign, sampleBloomFilter, sampleTeePuk, defaultTxOptions
                );
                if (result.success) {
                    console.log('✅ submitVerifyServiceResult successful!', {txHash: result.txHash, blockHash: result.blockHash});
                } else {
                    console.error('❌ submitVerifyServiceResult failed (expected):', result.error);
                }
            } catch (error) {
                console.error('❌ Error during submitVerifyServiceResult (expected):', error);
            }
        }

        await client.close();
    } catch (error) {
        console.error('Error:', error);
    }
}

main().catch(console.error);