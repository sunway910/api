import { CESS, CESSConfig } from "@/cess";
import { getMnemonic } from "@/test/config";

describe("Sminer Pallet Tests", () => {
    let client: CESS;
    let testMinerAccount: string | undefined;
    let currentEra: number = 0;

    const config: CESSConfig = {
        name: "CESS-Pre-MainNet",
        rpcs: ["wss://pm-rpc.cess.network/ws/", "wss://testnet.cess.network/ws/"],
        privateKey: getMnemonic(),
        ss58Format: 11330,
        enableEventListener: false,
    };

    beforeAll(async () => {
        client = await CESS.newClient(config);

        // Get a miner account for specific queries
        const allMiners = await client.queryMinerByAccountId();
        if (Array.isArray(allMiners) && allMiners.length > 0) {
            testMinerAccount = allMiners[0].account;
        } else {
            testMinerAccount = client.getSignatureAcc(); // Fallback to own address for some tests
        }

        // Get current era for era-specific queries
        try {
            currentEra = await client.queryCurrentEraNumber();
        } catch (e) {
            // If we can't fetch current era, era-specific tests will be skipped
            console.warn("Could not fetch current era:", e);
        }
    }, 60000); // Increase timeout for blockchain connection

    afterAll(async () => {
        if (client) {
            await client.close();
        }
    });

    test("should query expanders", async () => {
        const expanders = await client.queryExpander();
        expect(expanders).toBeDefined();
    }, 60000);

    test("should query miner by account id", async () => {
        const allMiners = await client.queryMinerByAccountId();
        expect(allMiners).toBeDefined();
    }, 60000);

    test("should query staking start block", async () => {
        const allStakingStarts = await client.queryStakingStartBlock();
        expect(allStakingStarts).toBeDefined();
    }, 60000);

    test("should query all miner addresses", async () => {
        const allMinerAddresses = await client.queryAllMiner();
        expect(allMinerAddresses).toBeDefined();
    }, 60000);

    test("should query counter for miner items", async () => {
        const totalMiners = await client.queryCounterForMinerItems();
        expect(totalMiners).toBeDefined();
    }, 60000);

    test("should query reward map by account id", async () => {
        const allRewardMaps = await client.queryRewardMapByAccountId();
        expect(allRewardMaps).toBeDefined();
    }, 60000);

    test("should query miner lock by account id", async () => {
        if (testMinerAccount) {
            const minerLock = await client.queryMinerLockByAccountId(testMinerAccount);
            expect(minerLock).toBeDefined();
        }
    }, 60000);

    test("should query restoral target by account id", async () => {
        const allRestoralTargets = await client.queryRestoralTargetByAccountId();
        expect(allRestoralTargets).toBeDefined();
    }, 60000);

    test("should query pending replacements", async () => {
        const allPendingReplacements = await client.queryPendingReplacements();
        expect(allPendingReplacements).toBeDefined();
    }, 60000);

    test("should query complete snapshot", async () => {
        if (currentEra > 0) {
            const completeSnapShot = await client.queryCompleteSnapShot(currentEra - 1); // Query previous era
            expect(completeSnapShot).toBeDefined();
        }
    }, 60000);

    test("should query complete miner snapshot", async () => {
        const allCompleteMinerSnapShot = await client.queryCompleteMinerSnapShot();
        expect(allCompleteMinerSnapShot).toBeDefined();
    }, 60000);
});