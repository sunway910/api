import { CESS, CESSConfig } from "@/cess";
import { getMnemonic } from "@/test/config";

describe("OSS Pallet Tests", () => {
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

    test("should query all OSS", async () => {
        const allOss = await client.queryOssByAccountId();
        expect(allOss).toBeDefined();
    }, 15000);

    test("should query specific OSS", async () => {
        const allOss = await client.queryOssByAccountId();
        let myOss = null;
        if (Array.isArray(allOss) && allOss.length > 0) {
            myOss = await client.queryOssByAccountId(allOss[0].account);
        }
        expect(myOss).toBeDefined();
    }, 15000);

    test("should query all authorities", async () => {
        const allAuthorities = await client.queryAuthorityListByAccountId();
        expect(allAuthorities).toBeDefined();
    }, 15000);

    test("should query specific authorities", async () => {
        const allOss = await client.queryOssByAccountId();
        let myAuthorities = null;
        if (Array.isArray(allOss) && allOss.length > 0) {
            myAuthorities = await client.queryAuthorityListByAccountId(allOss[0].account);
        }
        expect(myAuthorities).toBeDefined();
    }, 15000);
});