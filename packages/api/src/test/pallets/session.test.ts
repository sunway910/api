import { CESS, CESSConfig } from "@/cess";
import { getMnemonic } from "@/test/config";

describe("Session Pallet Tests", () => {
    let client: CESS;

    const config: CESSConfig = {
        name: "CESS-Pre-MainNet",
        rpcs: ["wss://pm-rpc.cess.network/ws/", "wss://testnet.cess.network/ws/"],
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

    test("should query validators", async () => {
        const validators = await client.queryValidators();
        expect(validators).toBeDefined();
    }, 15000);

    test("should query validators at specific block", async () => {
        const currentBlock = await client.api!.query.system.number();
        const validatorsAtBlock = await client.queryValidators(Number(currentBlock.toString()));
        expect(validatorsAtBlock).toBeDefined();
    }, 15000);

    test("should query disabled validators from session", async () => {
        const disabledValidators = await client.queryDisabledValidatorsFromSession();
        expect(disabledValidators).toBeDefined();
    }, 15000);

    test("should query disabled validators from session at specific block", async () => {
        const currentBlock = await client.api!.query.system.number();
        const disabledValidatorsAtBlock = await client.queryDisabledValidatorsFromSession(Number(currentBlock.toString()));
        expect(disabledValidatorsAtBlock).toBeDefined();
    }, 15000);
});