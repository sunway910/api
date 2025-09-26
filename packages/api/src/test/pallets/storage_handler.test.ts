import { CESS, CESSConfig } from "@/cess";
import { getMnemonic } from "@/test/config";

describe("Storage Handler Pallet Tests", () => {
    let client: CESS;
    let accountAddress: string;

    const config: CESSConfig = {
        name: "CESS-Pre-MainNet",
        rpcs: ["wss://pm-rpc.cess.network/ws/", "wss://testnet.cess.network/ws/"],
        privateKey: getMnemonic(),
        ss58Format: 11330,
        enableEventListener: false,
    };

    const enableQuery = true;

    beforeAll(async () => {
        client = await CESS.newClient(config);
        accountAddress = client.getSignatureAcc();
    }, 30000); // Increase timeout for blockchain connection

    afterAll(async () => {
        if (client) {
            await client.close();
        }
    });

    test("should query unit price", async () => {
        if (enableQuery) {
            const unitPrice = await client.queryUnitPrice();
            expect(unitPrice).toBeDefined();
        }
    }, 30000);

    test("should query total idle space", async () => {
        if (enableQuery) {
            const totalIdleSpace = await client.queryTotalIdleSpace();
            expect(totalIdleSpace).toBeDefined();
        }
    }, 30000);

    test("should query total service space", async () => {
        if (enableQuery) {
            const totalServiceSpace = await client.queryTotalServiceSpace();
            expect(totalServiceSpace).toBeDefined();
        }
    }, 30000);

    test("should query purchased space", async () => {
        if (enableQuery) {
            const purchasedSpace = await client.queryPurchasedSpace();
            expect(purchasedSpace).toBeDefined();
        }
    }, 30000);

    test("should query pay order", async () => {
        if (enableQuery) {
            const payOrderList = await client.queryPayOrder();
            expect(payOrderList).toBeDefined();
        }
    }, 30000);

    test("should query territory", async () => {
        if (enableQuery) {
            const territoryInfo = await client.queryTerritory(accountAddress);
            expect(territoryInfo).toBeDefined();
        }
    }, 30000);

    test("should query consignment", async () => {
        if (enableQuery) {
            const consignmentList = await client.queryConsignment();
            expect(consignmentList).toBeDefined();
        }
    }, 30000);
});