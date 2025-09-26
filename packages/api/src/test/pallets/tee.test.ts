import { CESS, CESSConfig } from "@/cess";
import { getMnemonic } from "@/test/config";

describe("TEE Worker Pallet Tests", () => {
    let client: CESS;

    const config: CESSConfig = {
        name: "CESS-Pre-MainNet",
        rpcs: ["wss://pm-rpc.cess.network/ws/", "wss://testnet-rpc.cess.network/ws/"],
        privateKey: getMnemonic(),
        ss58Format: 11330,
        enableEventListener: false,
    };

    beforeAll(async () => {
        client = await CESS.newClient(config);
    }, 15000); // Increase timeout for blockchain connection

    afterAll(async () => {
        if (client) {
            await client.close();
        }
    });

    test("should query master public key", async () => {
        const masterPubKey = await client.queryMasterPubKey();
        expect(masterPubKey).toBeDefined();
    }, 15000);

    test("should query worker count", async () => {
        const workerCount = await client.queryWorkerCount();
        expect(workerCount).toBeDefined();
    }, 15000);

    test("should query all workers", async () => {
        const allWorkers = await client.queryWorkerByPubKey();
        expect(allWorkers).toBeDefined();
    }, 15000);

    test("should query all endpoints", async () => {
        const allEndpoints = await client.queryEndpoints();
        expect(allEndpoints).toBeDefined();
    }, 15000);

    test("should query all worker start blocks", async () => {
        const allStartBlocks = await client.queryWorkerStartBlockByPubKey();
        expect(allStartBlocks).toBeDefined();
    }, 15000);

    test("should query specific worker and endpoint", async () => {
        const allWorkers = await client.queryWorkerByPubKey();
        let singleWorker = null;
        let endpoint = null;
        let startBlock = null;

        if (allWorkers && Array.isArray(allWorkers) && allWorkers.length > 0) {
            const firstWorker = allWorkers[0] as any;
            const workerPubKey = firstWorker.publicKey;

            // Query specific worker
            [singleWorker, endpoint, startBlock] = await Promise.all([
                client.queryWorkerByPubKey(workerPubKey),
                client.queryEndpoints(workerPubKey),
                client.queryWorkerStartBlockByPubKey(workerPubKey)
            ]);
        }

        expect(singleWorker).toBeDefined();
        expect(endpoint).toBeDefined();
        expect(startBlock).toBeDefined();
    }, 15000);
});