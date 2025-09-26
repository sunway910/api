import { CESS, CESSConfig } from "@/cess";
import { getMnemonic } from "@/test/config";

describe("File Bank Pallet Tests", () => {
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
    }, 60000); // Increase timeout for blockchain connection

    afterAll(async () => {
        if (client) {
            await client.close();
        }
    });

    test("should query file by fid", async () => {
        const fileMap = await client.queryFileByFid();
        // Just check that the method works, regardless of whether there are files
        expect(fileMap).toBeDefined();
    }, 60000);

    test("should query restoral order", async () => {
        const restoralOrders = await client.queryRestoralOrder();
        // Just check that the method works, regardless of whether there are orders
        expect(restoralOrders).toBeDefined();
    }, 60000);

    test("should query task failed count", async () => {
        const failedCount = await client.queryTaskFailedCount(accountAddress);
        expect(failedCount).toBeDefined();
    }, 60000);

    test("should query user hold file list", async () => {
        const userFiles = await client.queryUserHoldFileList();
        // Just check that the method works
        expect(userFiles).toBeDefined();
    }, 60000);
});