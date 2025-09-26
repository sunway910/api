import { CESS, CESSConfig } from "@/cess";
import { getMnemonic } from "@/test/config";

async function main() {
    try {
        const config: CESSConfig = {
            name: "CESS-Pre-Mainnet",
            rpcs: ["wss://pm-rpc.cess.network/ws/", "wss://testnet-rpc.cess.network/ws/"],
            privateKey: getMnemonic(),
            ss58Format: 11330,
            enableEventListener: false,
        }

        // new client
        const client = await CESS.newClient(config);

        console.log('Chain Metadata:', client.chainInfo);
        console.log('Account address:', client.getSignatureAcc());
        console.log('Account balance:', client.getBalances().toString());
        console.log('Chain Metadata:', client.getMetadata());


        await client.close();
    } catch (error) {
        console.error('Error:', error);
    }
}

main().catch(console.error);