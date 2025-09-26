import { CESS, CESSConfig } from "@/cess";
import { getMnemonic } from "@/test/config";

describe("System Pallet Tests", () => {
    let client: CESS;
    let accountAddress: string;

    const config: CESSConfig = {
        name: "CESS-Pre-MainNet",
        rpcs: ["wss://pm-rpc.cess.network/ws/", "wss://testnet.cess.network/ws/"],
        privateKey: getMnemonic(),
        ss58Format: 11330,
        enableEventListener: false,
    };

    beforeAll(async () => {
        client = await CESS.newClient(config);
        accountAddress = client.getSignatureAcc();
    }, 15000); // Increase timeout for blockchain connection

    afterAll(async () => {
        if (client) {
            await client.close();
        }
    });

    test("should query chain information", () => {
        // Test basic chain information
        expect(client.getNetworkEnv()).toBeDefined();
        expect(accountAddress).toBeDefined();
    }, 15000);

    test("should get block by hash", async () => {
        const blockHash = await client.getFinalizedHeadHash();
        const block = await client.getBlockByHash(blockHash);
        expect(block).toBeDefined();
    }, 15000);

    test("should get block hash by block number", async () => {
        // Get a recent block number
        const finalizedHead = await client.getFinalizedHeadHash();
        const block = await client.getBlockByHash(finalizedHead);
        const blockNumber = block.block.header.number.toNumber() - 100; // A few blocks back

        const blockHash = await client.getBlockHashByBlockNum(blockNumber);
        expect(blockHash).toBeDefined();
    }, 15000);

    test("should get finalized head", async () => {
        const finalizedHead = await client.getFinalizedHeadHash();
        expect(finalizedHead).toBeDefined();
    }, 15000);

    test("should check if node is listening", async () => {
        const listening = await client.isNetListening();
        expect(typeof listening).toBe('boolean');
    }, 15000);

    test("should get system sync state", async () => {
        const syncState = await client.getSystemSyncState();
        expect(syncState).toBeDefined();
        expect(typeof syncState).toBe('object');
    }, 15000);

    test("should get system version", async () => {
        const version = await client.getSystemVersion();
        expect(typeof version).toBe('string');
        expect(version.length).toBeGreaterThan(0);
    }, 15000);

    test("should get account next index (current nonce)", async () => {
        const nonce = await client.queryCurrentNonce();
        expect(typeof nonce).toBe('number');
        expect(nonce).toBeGreaterThanOrEqual(0);
    }, 15000);

    test("should rotate keys", async () => {
        const keys = await client.rotateKeys();
        expect(keys).toBeDefined();
        // Keys should be a hex string
        expect(typeof keys.toString()).toBe('string');
    }, 15000);
});