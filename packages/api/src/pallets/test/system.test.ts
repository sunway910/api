import { CESS, CESSConfig } from "@/cess";
import {
    getBlockByHash,
    getBlockHashByBlockNum,
    getFinalizedHeadHash,
    isNetListening,
    queryAccountById,
    queryBlockDataByHash,
    queryBlockHashByNumber,
    queryBlockNumberByHash,
    queryChainHealthStatus,
    queryChainName,
    queryChainProperties,
    queryChainType,
    queryChainVersion,
    queryCurrentNonce,
    queryFinalizedHead,
    systemChain,
    systemSyncState,
    systemVersion,
} from "../system";
import { AccountInfoData } from '@cessnetwork/types';
import { getMnemonic } from "@/test/config";
import { isApiReady, isKeyringReady } from "@/utils/tx";
import { SDKError } from "@/utils";

async function main() {
    try {
        const config: CESSConfig = {
            name: "CESS-Pre-MainNet",
            rpcs: ["wss://pm-rpc.cess.network/ws/", "wss://testnet-rpc.cess.network/ws/"],
            privateKey: getMnemonic(),
            ss58Format: 11330,
            enableEventListener: false,
        };

        // Instantiate a new client
        const client = await CESS.newClient(config);
        console.log('Connected to network:', client.getNetworkEnv());
        const accountAddress = client.getSignatureAcc();
        console.log('Account address:', accountAddress);


        if (!isApiReady(client.api)) {
            throw new SDKError('API Client is not ready', 'INVALID_API_CLIENT');
        }

        console.log("\n--- Querying System Pallet ---");

        // 1. queryChainName
        const chainName = await queryChainName(client.api);
        console.log('Query Chain Name result:', chainName);

        // 2. queryChainType
        const chainType = await queryChainType(client.api);
        console.log('Query Chain Type result:', chainType);

        // 3. queryChainVersion
        const chainVersion = await queryChainVersion(client.api);
        console.log('Query Chain Version result:', chainVersion);

        // 4. queryChainHealthStatus
        const health = await queryChainHealthStatus(client.api);
        console.log('Query Chain Health Status result:', health);

        // 5. queryChainProperties
        const properties = await queryChainProperties(client.api);
        console.log('Query Chain Properties result:', properties);

        // 6. queryFinalizedHead
        const finalizedHead = await queryFinalizedHead(client.api);
        console.log('Query Finalized Head result:', finalizedHead);

        // 7. queryBlockNumberByHash (latest block)
        const latestBlockNumber = await queryBlockNumberByHash(client.api);
        console.log('Query Latest Block Number result:', latestBlockNumber);

        // 8. queryBlockHashByNumber (for block 1)
        const block1Hash = await queryBlockHashByNumber(client.api, 1);
        console.log('Query Block Hash for block #1 result:', block1Hash);

        // 9. queryBlockNumberByHash (for the hash of block 1)
        const blockNumberForHash = await queryBlockNumberByHash(client.api, block1Hash);
        console.log(`Query Block Number for hash ${block1Hash} result:`, blockNumberForHash);

        // 10. queryBlockDataByHash (latest block)
        const latestBlockData = await queryBlockDataByHash(client.api);
        console.log('Query Latest Block Data result: block hash', latestBlockData.block.header.hash.toHuman());

        // 11. queryBlockDataByHash (for hash of block 1)
        const block1Data = await queryBlockDataByHash(client.api, block1Hash);
        console.log('Query Block #1 Data result: block hash', block1Data.block.header.hash.toHuman());

        // 12. queryAccountInfoByAccountID
        const accountInfoById = await queryAccountById(client.api, accountAddress) as AccountInfoData;
        console.log(`Query Account Info by AccountID for ${accountAddress} result:`, accountInfoById);

        if (!isKeyringReady(client.keyring)) {
            throw new SDKError('Keyring Pair is required', 'INVALID_KEYRING');
        }

        // 13. queryCurrentNonce (current nonce)
        const currentNonce = await queryCurrentNonce(client.api, client.keyring);
        console.log(`Query Current Nonce for ${accountAddress} result:`, currentNonce);

        // 14. chainGetBlock
        const blockByHash = await getBlockByHash(client.api, block1Hash);
        console.log('Chain Get Block result: block hash', blockByHash.block.header.hash.toHuman());

        // 15. chainGetBlockHash
        const blockHashByNumber = await getBlockHashByBlockNum(client.api, 1);
        console.log('Chain Get Block Hash result:', blockHashByNumber);

        // 16. chainGetFinalizedHead
        const chainFinalizedHead = await getFinalizedHeadHash(client.api);
        console.log('Chain Get Finalized Head result:', chainFinalizedHead);

        // 17. netListening
        const isListening = await isNetListening(client.api);
        console.log('Net Listening result:', isListening);

        // 18. systemChain
        const sysChain = await systemChain(client.api);
        console.log('System Chain result:', sysChain);

        // 19. systemSyncState
        const syncState = await systemSyncState(client.api);
        console.log('System Sync State result:', syncState);

        // 20. systemVersion
        const sysVersion = await systemVersion(client.api);
        console.log('System Version result:', sysVersion);

        // 21. rotateKeys only for rpc node with unsafe mode
        // const rotatedKeys = await rotateKeys(client.api);
        // console.log('Rotate Keys result:', rotatedKeys);

        await client.close();
    } catch (error) {
        console.error('Error:', error);
    }
}

main().catch(console.error);
