import { CESS, CESSConfig } from "@/cess";
import { getMnemonic } from "@/test/config";

describe("Staking Pallet Tests", () => {
    let client: CESS;
    let accountAddress: string;
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
        accountAddress = client.getSignatureAcc();
        currentEra = await client.queryCurrentEraNumber();
    }, 30000); // Increase timeout for blockchain connection

    afterAll(async () => {
        if (client) {
            await client.close();
        }
    });

    test("should query validator and nominator total count", async () => {
        const totalCount = await client.queryValidatorAndNominatorTotalCount();
        expect(totalCount).toBeDefined();
    }, 30000);

    test("should query current validator count", async () => {
        const validatorCount = await client.queryCurrentValidatorCount();
        expect(validatorCount).toBeDefined();
    }, 30000);

    test("should query current era number", async () => {
        const currentEra = await client.queryCurrentEraNumber();
        expect(currentEra).toBeDefined();
    }, 30000);

    test("should query total stake by era number", async () => {
        const totalStakeAllEras = await client.queryTotalStakeByEraNumber();
        expect(totalStakeAllEras).toBeDefined();
    }, 30000);

    test("should query reward point by era number", async () => {
        const rewardPointsAllEras = await client.queryRewardPointByEraNumber();
        expect(rewardPointsAllEras).toBeDefined();
    }, 30000);

    test("should query bonded", async () => {
        const allBonded = await client.queryAllBonded();
        expect(allBonded).toBeDefined();
    }, 30000);

    test("should query validator commission", async () => {
        const allValidators = await client.queryValidatorCommission();
        expect(allValidators).toBeDefined();
    }, 30000);

    test("should query validator reward by era number", async () => {
        const validatorRewardsAllEras = await client.queryValidatorRewardByEraNumber();
        expect(validatorRewardsAllEras).toBeDefined();
    }, 30000);

    test("should query ledger", async () => {
        const allLedgers = await client.queryLedger();
        expect(allLedgers).toBeDefined();
    }, 30000);

    test("should query staker by era number", async () => {
        if (currentEra > 0) {
            const allStakerInEra = await client.queryStakeByEraNumber(currentEra);
            expect(allStakerInEra).toBeDefined();
        }
    }, 30000);

    test("should query all eras staker paged", async () => {
        const allStakerPaged = await client.queryAllErasStakePaged(50, "cXfFbPCqWUyRW6FBdPcrHaaYhfPNXBUCgsDDp2F6VVBeRTqTH");
        expect(allStakerPaged).toBeDefined();
    }, 30000);

    test("should query staker overview by era", async () => {
        if (currentEra > 0) {
            const allStakerOverviews = await client.queryStakeOverviewByEra(currentEra);
            expect(allStakerOverviews).toBeDefined();
        }
    }, 30000);

    test("should query nominator", async () => {
        const allNominators = await client.queryNominator();
        expect(allNominators).toBeDefined();
    }, 30000);

    test("should query minimum active stake", async () => {
        const minActiveStake = await client.queryMinimumActiveStake();
        expect(minActiveStake).toBeDefined();
    }, 30000);

    test("should query minimum validator count", async () => {
        const minValidatorCount = await client.queryMinimumValidatorCount();
        expect(minValidatorCount).toBeDefined();
    }, 30000);

    test("should query active era", async () => {
        const activeEra = await client.queryActiveEra();
        expect(activeEra).toBeDefined();
    }, 30000);

    test("should query canceled slash payout", async () => {
        const canceledSlashPayout = await client.queryCanceledSlashPayout();
        expect(canceledSlashPayout).toBeDefined();
    }, 30000);

    test("should query claimed reward", async () => {
        if (currentEra > 0) {
            const claimedReward = await client.queryClaimedRewards(currentEra, accountAddress);
            expect(claimedReward).toBeDefined();
        }
    }, 30000);

    test("should query current planned session", async () => {
        const currentPlannedSession = await client.queryCurrentPlannedSession();
        expect(currentPlannedSession).toBeDefined();
    }, 30000);

    test("should query disabled validators", async () => {
        const disabledValidators = await client.queryDisabledValidators();
        expect(disabledValidators).toBeDefined();
    }, 30000);
});