import { CESS, CESSConfig } from "@/cess";
import { TokenFormatter } from "@cessnetwork/util";
import { decodeAddress } from "@polkadot/keyring";
import { AccountInfoData } from "@cessnetwork/types";
import { getMnemonic } from "@/test/config";

describe("Balances Pallet Tests", () => {
    let client: CESS;
    let accountAddress: string;
    let accountId: string;

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
        accountId = decodeAddress(accountAddress).toString();
    }, 30000); // Increase timeout for blockchain connection

    afterAll(async () => {
        if (client) {
            await client.close();
        }
    });

    const format = (value: any) => TokenFormatter.formatBalance(value.toString(), client.tokenDecimals, {
        displayDecimals: 4,
        useGrouping: true,
        symbol: 'CESS'
    });

    // Skip these tests for now as they seem to have issues with the current chain state
    // We'll investigate and fix them properly later
    test("should query account balance", async () => {
        const balance = await client.queryAccountById(accountAddress);
        expect(balance).toBeDefined();
        expect((balance as AccountInfoData).data).toBeDefined();
    }, 30000);

    test("should query balance holds", async () => {
        const holds = await client.queryBalanceHoldsByAccountId(accountAddress);
        expect(holds).toBeDefined();
    }, 30000);

    test("should query balance locks", async () => {
        const locks = await client.queryBalanceLocksByAccountId(accountAddress);
        expect(locks).toBeDefined();
    }, 30000);

    test("should query total issuance", async () => {
        const totalIssuance = await client.queryTotalIssuance();
        expect(totalIssuance).toBeDefined();
    }, 30000);

    test("should query inactive issuance", async () => {
        const inactiveIssuance = await client.queryInactiveIssuance();
        expect(inactiveIssuance).toBeDefined();
    }, 30000);
});