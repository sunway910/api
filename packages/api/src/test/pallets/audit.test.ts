import { CESS, CESSConfig } from "@/cess";
import { getMnemonic } from "@/test/config";

describe("Audit Pallet Tests", () => {
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

    test("should query challenge snapshot", async () => {
        const challengeSnapShot = await client.queryChallengeSnapShot(accountAddress);
        expect(challengeSnapShot).toBeDefined();
    }, 15000);

    test("should query counted clear", async () => {
        const countedClear = await client.queryCountedClear(accountAddress);
        expect(countedClear).toBeDefined();
    }, 15000);

    test("should query counted service failed", async () => {
        const serviceFailed = await client.queryCountedServiceFailed(accountAddress);
        expect(serviceFailed).toBeDefined();
    }, 15000);
});