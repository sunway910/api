import { CESS, CESSConfig } from "@/cess";
import { getMnemonic } from "@/test/config";

async function main() {
    try {
        const config: CESSConfig = {
            name: "CESS-Pre-MainNet",
            rpcs: ["wss://pm-rpc.cess.network/ws/", "wss://testnet-rpc.cess.network/ws/"],
            privateKey: getMnemonic(),
            ss58Format: 11330,
            enableEventListener: false,
        };

        // new client
        const client = await CESS.newClient(config);
        console.log('Connected to network:', client.getNetworkEnv());
        console.log('Account address:', client.getSignatureAcc());

        console.log("\n--- Querying TEE Worker Pallet using ChainClient methods ---");

        // 1. queryMasterPubKey
        const masterPubKey = await client.queryMasterPubKey();
        console.log('Query Master Public Key result:', masterPubKey);

        // 2. queryWorkerCount
        const workerCount = await client.queryWorkerCount();
        console.log('Query Worker Count result:', workerCount);

        // 3. queryWorkerByPubKey (all workers)
        const allWorkers = await client.queryWorkerByPubKey();
        console.log('Query All Workers result:', allWorkers);

        // 4. queryEndpoints (all endpoints)
        const allEndpoints = await client.queryEndpoints();
        console.log('Query All Endpoints result:', allEndpoints);

        // 5. queryWorkerStartBlockByPubKey (all workers)
        const allStartBlocks = await client.queryWorkerStartBlockByPubKey();
        console.log('Query All Worker Start Blocks result:', allStartBlocks);

        if (allWorkers && Array.isArray(allWorkers) && allWorkers.length > 0) {
            const firstWorker = allWorkers[0] as any;
            const workerPubKey = firstWorker.publicKey;
            console.log(`\n--- Using worker public key: ${workerPubKey} for specific queries ---`);

            // 6. queryWorkerByPubKey (specific worker)
            const singleWorker = await client.queryWorkerByPubKey(workerPubKey);
            console.log('Query Single Worker by PubKey result:', singleWorker);

            // 7. queryEndpoints (specific worker)
            const endpoint = await client.queryEndpoints(workerPubKey);
            console.log('Query Endpoint by PubKey result:', endpoint);

            // 8. queryWorkerStartBlockByPubKey (specific worker)
            const startBlock = await client.queryWorkerStartBlockByPubKey(workerPubKey);
            console.log('Query Worker Start Block by PubKey result:', startBlock);
        } else {
            console.log("\nNo workers found, skipping specific worker queries.");
        }

        await client.close();
    } catch (error) {
        console.error('Error:', error);
    }
}

main().catch(console.error);