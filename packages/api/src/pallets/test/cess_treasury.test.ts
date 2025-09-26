import { CESS, CESSConfig } from "@/cess";
import { TokenFormatter } from "@cessnetwork/util";
import { getMnemonic } from "@/test/config";

async function main() {
    try {
        const config: CESSConfig = {
            name: "CESS-Pre-MainNet",
            rpcs: ["wss://pm-rpc.cess.network/ws/", "wss://testnet.cess.network/ws/"],
            privateKey: getMnemonic(),
            ss58Format: 11330,
            enableEventListener: false,
        };

        // Instantiate a new client
        const client = await CESS.newClient(config);
        console.log('Connected to network:', client.getNetworkEnv());

        const currentBlock = await client.api!.query.system.number();
        console.log(`Current block: ${currentBlock}`);
        const blockHash = await client.api!.rpc.chain.getBlockHash(Number(currentBlock.toString()));
        console.log(`Current block hash: ${blockHash}`);

        const currentEra = await client.queryCurrentEraNumber();
        console.log(`Current era: ${currentEra}`);

        console.log("\n--- Querying CESS Treasury Pallet using ChainClient methods ---");

        const format = (value:  bigint | string | number) => TokenFormatter.formatBalance(value, client.tokenDecimals, {
            displayDecimals: 4,
            useGrouping: true,
            symbol: 'CESS'
        });

        // 1. queryCurrencyReward
        console.log("\n1. Testing queryCurrencyReward");
        const currencyReward = await client.queryCurrencyReward();
        console.log('Query Currency Reward result:', format(currencyReward));

        // 2. queryEraReward
        console.log("\n2. Testing queryEraReward");
        const eraReward = await client.queryEraReward();
        console.log('Query Era Reward result:', format(eraReward));

        // 3. queryReserveReward
        console.log("\n3. Testing queryReserveReward");
        const reserveReward = await client.queryReserveReward();
        console.log('Query Reserve Reward result:', format(reserveReward));

        // 4. queryRoundReward for the current era
        console.log(`\n4. Testing queryRoundReward for era ${currentEra}`);
        const roundReward = await client.queryRoundReward(currentEra);
        console.log(`Query Round Reward for era ${currentEra} result:`, format(roundReward));

        // 5. Test with block hash
        console.log(`\n5. Testing queries at block ${currentBlock}`);
        const currencyRewardAtBlock = await client.queryCurrencyReward(Number(currentBlock.toString()));
        console.log(`   - Currency Reward at block:`, format(currencyRewardAtBlock));
        const eraRewardAtBlock = await client.queryEraReward(Number(currentBlock.toString()));
        console.log(`   - Era Reward at block:`, format(eraRewardAtBlock));

        await client.close();
    } catch (error) {
        console.error('Error:', error);
    }
}

main().catch(console.error);
