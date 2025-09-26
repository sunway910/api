import { CESS, CESSConfig } from "@/cess"
import { TransactionOptions } from "@/utils/tx";
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

        const enableQuery = true;
        const enableTx = true;

        // Instantiate a new client
        const client = await CESS.newClient(config);
        console.log('Connected to network:', client.getNetworkEnv());
        const accountAddress = client.getSignatureAcc();
        console.log('Account address:', accountAddress);

        const currentBlock = await client.api!.query.system.number();
        console.log(`Current block : ${currentBlock}`);

        if (enableQuery) {
            console.log("Querying OSS Pallet using ChainClient methods ---");

            // 1. queryOssByAccountId (all)
            const allOss = await client.queryOssByAccountId() as any[];
            console.log('Query All OSS result:', allOss);

            // 2. queryOssByAccountId (specific account)
            if (allOss.length > 0) {
                const myOss = await client.queryOssByAccountId(allOss[0].account);
                console.log(`Query OSS for ${allOss[0].account} result:`, myOss);
            }

            // 3. queryAuthorityListByAccountId (all)
            const allAuthorities = await client.queryAuthorityListByAccountId() as any[];
            console.log('Query All Authorities result first 2 items:', allAuthorities.slice(0, 2));

            // 4. queryAuthorityListByAccountId (specific oss account)
            if (allOss.length > 0) {
                const myAuthorities = await client.queryAuthorityListByAccountId(allOss[0].account);
                console.log(`Query Authorities for ${allOss[0].account} result:`, myAuthorities);
            }
        }

        if (enableTx) {
            console.log(" Submitting OSS Transactions using ChainClient methods ");

            const defaultTxOptions: TransactionOptions = {
                waitForFinalization: true, // Wait for finalization to see changes in subsequent queries
                timeout: 120000,
            };

            const domain = `https://example-oss-${Date.now()}.com`;
            const updatedDomain = `https://updated-oss-${Date.now()}.com`;
            const authorizedAccount = "cXiHhxQmG5sVQsiYD3hyRzwvJxPqAaNcGdtikbkcfJsX9eMFP"; // A sample account

            // 1. registerOssNode
            console.log(`\\n1. Testing registerOssNode with domain: ${domain}`);
            try {
                const result = await client.registerOssNode(domain, defaultTxOptions);
                if (result.success) {
                    console.log('✅ OSS registered successfully!', {txHash: result.txHash, blockHash: result.blockHash});
                    const myOss = await client.queryOssByAccountId(accountAddress);
                    console.log('OSS details after registration:', myOss);
                } else {
                    console.error('❌ OSS registration failed:', result.error);
                }
            } catch (error) {
                console.error('❌ Error during OSS registration:', error);
            }

            // 2. updateOssEndpoint
            console.log(`n2. Testing updateOssEndpoint to: ${updatedDomain}`);
            try {
                const result = await client.updateOssEndpoint(updatedDomain, defaultTxOptions);
                if (result.success) {
                    console.log('✅ OSS updated successfully!', {txHash: result.txHash, blockHash: result.blockHash});
                    const myOss = await client.queryOssByAccountId(accountAddress);
                    console.log('OSS details after update:', myOss);
                } else {
                    console.error('❌ OSS update failed:', result.error);
                }
            } catch (error) {
                console.error('❌ Error during OSS update:', error);
            }

            // 3. authorize
            console.log(`n3. Testing authorize for account: ${authorizedAccount}`);
            try {
                const result = await client.authorize(authorizedAccount, defaultTxOptions);
                if (result.success) {
                    console.log('✅ Authorization successful!', {txHash: result.txHash, blockHash: result.blockHash});
                    const myAuthorities = await client.queryAuthorityListByAccountId(accountAddress);
                    console.log('Authorities after authorization:', myAuthorities);
                } else {
                    console.error('❌ Authorization failed:', result.error);
                }
            } catch (error) {
                console.error('❌ Error during authorization:', error);
            }

            // 4. cancelAuthorize
            console.log(`n4. Testing cancelAuthorize for account: ${authorizedAccount}`);
            try {
                const result = await client.cancelOssAuthorize(authorizedAccount, defaultTxOptions);
                if (result.success) {
                    console.log('✅ Authorization cancelled successfully!', {txHash: result.txHash, blockHash: result.blockHash});
                    const myAuthorities = await client.queryAuthorityListByAccountId(accountAddress);
                    console.log('Authorities after cancellation:', myAuthorities);
                } else {
                    console.error('❌ Authorization cancellation failed:', result.error);
                }
            } catch (error) {
                console.error('❌ Error during authorization cancellation:', error);
            }

            // 5. destroyOss
            console.log(`\\n5. Testing destroyOss`);
            try {
                const result = await client.destroyOss(defaultTxOptions);
                if (result.success) {
                    console.log('✅ OSS destroyed successfully!', {txHash: result.txHash, blockHash: result.blockHash});
                    const myOss = await client.queryOssByAccountId(accountAddress);
                    console.log('OSS details after destruction:', myOss);
                } else {
                    console.error('❌ OSS destruction failed:', result.error);
                }
            } catch (error) {
                console.error('❌ Error during OSS destruction:', error);
            }
        }

        await client.close();
    } catch (error) {
        console.error('Error:', error);
    }
}

main().catch(console.error);
