import { getMnemonic } from "@/test/config";
import { FileMetadata, GatewayConfig, OssAuthorityList, OssDetail, StorageOrder, Territory } from "@cessnetwork/types";
import * as console from "node:console";
import { u8aToHex } from "@polkadot/util";
import { createHash } from 'crypto';
import { CESS } from "@/cess";
import { downloadFile, ExtendedDownloadOptions, GenGatewayAccessToken, SDKError, uploadFile } from "@/utils";
import { safeSignUnixTime } from "@cessnetwork/util";

function calculateSHA256Hash(data: string): Buffer {
    const hash = createHash('sha256');
    hash.update(data);
    return hash.digest();
}


async function main() {
    const config = {
        name: "CESS-Pre-MainNet",
        rpcs: ["wss://pm-rpc.cess.network/ws/"],
        privateKey: getMnemonic(),
        ss58Format: 11330,
        enableEventListener: false,
    };
    const cess = await CESS.newClient(config);
    try {
        const accountAddress = cess.getSignatureAcc();
        console.log('Connected to network:', cess.getNetworkEnv());
        console.log('Account private key:', getMnemonic());
        console.log('Account address:', accountAddress);
        const gatewayUrl = "http://154.194.34.195:1306"

        // step1: sign message
        if (!cess.keyring) {
            throw new SDKError('Keyring Pair is required', 'INVALID_KEYRING');
        }
        let sign_message = Date.now().toString()
        // Sign the message with prefix and suffix: <Bytes>
        const signature = safeSignUnixTime(sign_message, getMnemonic());
        console.log("signature:", signature)


        // step2: mint territory if not exist
        let territoryToken
        const myTerritory = "default"
        const territory = await cess.queryTerritory(accountAddress, myTerritory) as Territory;

        if (!territory) {
            try {
                const result = await cess.mintTerritory(
                    1, // gibCount
                    myTerritory,
                    30, // days
                );

                if (result.success) {
                    console.log('✅ Mint successful!', {txHash: result.txHash, blockHash: result.blockHash});

                    // Wait and query the minted territory
                    console.log('Waiting 6 seconds before querying territory...');
                    await new Promise(resolve => setTimeout(resolve, 6000));

                    const territory = await cess.queryTerritory(accountAddress, myTerritory) as Territory;
                    territoryToken = territory?.token
                    console.log('Territory details:', territory);
                    console.log('Territory Token:', territoryToken);
                } else {
                    console.error('❌ Territory minting failed:', result.error);
                }
            } catch (error) {
                console.error('❌ Error during territory minting:', error);
            }
        } else {
            console.log("territory exist: ", territory)
        }

        // step3: auth to gateway acc if not auth

        // get gateway acc
        let gatewayAcc = ""
        const ossAccList = await cess.queryOssByAccountId() as unknown as OssDetail[]
        for (let i = 0; i < ossAccList.length; i++) {
            if (ossAccList[i].ossInfo.domain == gatewayUrl) {
                gatewayAcc = ossAccList[i].account
                break;
            }
        }

        // auth my territory to gateway acc
        const authList = await cess.queryAuthorityListByAccountId(gatewayAcc) as unknown as OssAuthorityList[]
        const authorizedAccounts: string[] = authList.map(item => item.authorizedAcc);
        if (!authorizedAccounts.indexOf(accountAddress)) {
            try {
                console.log("start to auth")
                const result = await cess.authorize(gatewayAcc);
                if (result.success) {
                    console.log('✅ Authorization successful!', {txHash: result.txHash, blockHash: result.blockHash});
                } else {
                    console.error('❌ Authorization failed:', result.error);
                }
            } catch (error) {
                console.error('❌ Error during authorization:', error);
            }
        } else {
            console.log("already auth")
        }

        // step4: get token from gateway
        const token = await GenGatewayAccessToken("http://154.194.34.195:1306", {
            account: accountAddress,
            message: sign_message,
            sign: u8aToHex(signature),
            expire: 1
        })

        // step5: upload file to gateway
        const gatewayConfig: GatewayConfig = {
            baseUrl: process.env.CESS_GATEWAY_URL || "http://154.194.34.195:1306",
            token: process.env.CESS_GATEWAY_TOKEN || token
        };

        let uploadResult = {} as any
        let fid = ""
        uploadResult = await uploadFile(gatewayConfig, "./src/utils/gateway/c.txt", {territory: myTerritory});

        if (uploadResult.code == 200) {
            fid = uploadResult.data
            console.log("upload success with fid: ", fid)
        } else {
            throw new Error("Failed to upload file")
        }

        // step6: download file from gateway
        const downloadOptions: ExtendedDownloadOptions = {
            fid: fid,
            savePath: "./src/utils/gateway/b.txt",
            overwrite: true,
            createDirectories: true,
        };
        const downloadResult = await downloadFile(gatewayConfig, downloadOptions);
        if (downloadResult.success) {
            console.log("download result: ", downloadResult.data)
        } else {
            throw new Error("Failed to download file")
        }
        console.log("download result:", downloadResult)

        // step7: query file
        // If the return value is not null, it means that the data is being distributed to storage miners.
        // otherwise it means that the data has been stored on the storage node
        const dealMap = await cess.queryDealMap(fid) as unknown as StorageOrder
        if (dealMap) {
            console.log("storage order detail: ", dealMap)
        } else {
            console.log("data has been stored on storage node")
            const fileMeta = await cess.queryFileByFid(fid) as unknown as FileMetadata
            console.log("file meta data: ", fileMeta)
        }


    } catch (error) {

    } finally {
        await cess.close();
    }
}

main().catch(console.error);