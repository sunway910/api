import { CESS, CESSConfig } from "@/cess";
import { getMnemonic } from "@/test/config";

describe("CESS Treasury Pallet Tests", () => {
    let client: CESS;
    let currentEra: number;

    const config: CESSConfig = {
        name: "CESS-Pre-MainNet",
        rpcs: ["wss://pm-rpc.cess.network/ws/", "wss://testnet.cess.network/ws/"],
        privateKey: getMnemonic(),
        ss58Format: 11330,
        enableEventListener: false,
    };

    beforeAll(async () => {
        client = await CESS.newClient(config);
        currentEra = await client.queryCurrentEraNumber();
    }, 15000); // Increase timeout for blockchain connection

    afterAll(async () => {
        if (client) {
            await client.close();
        }
    });

    test("should query currency reward", async () => {
        const currencyReward = await client.queryCurrencyReward();
        expect(currencyReward).toBeDefined();
    }, 15000);

    test("should query era reward", async () => {
        const eraReward = await client.queryEraReward();
        expect(eraReward).toBeDefined();
    }, 15000);

    test("should query reserve reward", async () => {
        const reserveReward = await client.queryReserveReward();
        expect(reserveReward).toBeDefined();
    }, 15000);

    test("should query round reward for current era", async () => {
        const roundReward = await client.queryRoundReward(currentEra);
        expect(roundReward).toBeDefined();
    }, 15000);

    test("should query rewards at specific block", async () => {
        const currentBlock = await client.api!.query.system.number();
        const [currencyRewardAtBlock, eraRewardAtBlock] = await Promise.all([
            client.queryCurrencyReward(Number(currentBlock.toString())),
            client.queryEraReward(Number(currentBlock.toString()))
        ]);
        expect(currencyRewardAtBlock).toBeDefined();
        expect(eraRewardAtBlock).toBeDefined();
    }, 15000);
});