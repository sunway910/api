import { CESS, CESSConfig } from "@/cess";
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
        console.log(`Current block : ${currentBlock}`);
        const blockHash = await client.api!.rpc.chain.getBlockHash(Number(currentBlock.toString()));
        console.log(`Current block hash: ${blockHash}`);

        console.log("\n--- Querying Session Pallet using ChainClient methods ---");

        // 1. queryValidators
        console.log("\n1. Testing queryValidators");
        const validators = await client.queryValidators();
        console.log('Query Validators result:', validators);
        if (validators.length > 0) {
            console.log('First validator:', validators[0].toString());
        }

        // 2. queryValidators with block hash
        console.log(`\n2. Testing queryValidators at block ${currentBlock}`);
        const validatorsAtBlock = await client.queryValidators(Number(currentBlock.toString()));
        console.log(`Query Validators at block ${currentBlock} result:`, validatorsAtBlock);

        // 3. queryDisabledValidatorsFromSession
        console.log("\n3. Testing queryDisabledValidatorsFromSession");
        const disabledValidators = await client.queryDisabledValidatorsFromSession();
        console.log('Query Disabled Validators result:', disabledValidators);

        // 4. queryDisabledValidatorsFromSession with block hash
        console.log(`\n4. Testing queryDisabledValidatorsFromSession at block ${currentBlock}`);
        const disabledValidatorsAtBlock = await client.queryDisabledValidatorsFromSession(Number(currentBlock.toString()));
        console.log(`Query Disabled Validators at block ${currentBlock} result:`, disabledValidatorsAtBlock);

        await client.close();
    } catch (error) {
        console.error('Error:', error);
    }
}

main().catch(console.error);
