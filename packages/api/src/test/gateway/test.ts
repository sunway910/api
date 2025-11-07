import { CESS } from "@/cess";
import { getMnemonic } from "@/test/config";
import { downloadFile, ExtendedDownloadOptions, GenGatewayAccessToken, SDKError, upload } from "@/utils";
import { FileMetadata, GatewayConfig, OssAuthorityList, OssDetail, StorageOrder, Territory } from "@cessnetwork/types";
import { safeSignUnixTime } from "@cessnetwork/util";
import { u8aToHex } from "@polkadot/util";

async function main() {
    const config = {
        name: "CESS-Pre-MainNet",
        rpcs: ["wss://pm-rpc.cess.network"],
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
        const gatewayUrl = "https://gateway1.cess.network"

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
        const curBlockHeight = await cess.queryBlockNumberByHash()
        console.log('Current Block Height:', curBlockHeight);

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
        } else if (territory.deadline - curBlockHeight <= 100800) {
            // 100800 block means 7 days
            const renewalRes = await cess.renewalTerritory(myTerritory, 10)
            console.log('renew territory successfully:', renewalRes.blockHash);
        } else if (territory.state != "Active" || curBlockHeight >= territory.deadline) {
            // data will be reset when re-activate territory
            const reactivateRes = await cess.reactivateTerritory(myTerritory, 30)
            console.log('reactivate territory successfully:', reactivateRes.blockHash);
        } else if (territory.remainingSpace <= 1024 * 1024 * 1024) {
            // remaining space <= 1GiB
            const expandRes = await cess.expandingTerritory(myTerritory, 1)
            console.log('expand territory successfully:', expandRes.blockHash);
        } else {
            console.log("territory exist: ", territory)
        }

        // step3: auth to gateway acc if not auth
        let gatewayAcc = ""
        // get oss public acc by domain name
        const ossAccList = await cess.queryOssByAccountId() as unknown as OssDetail[]
        for (let i = 0; i < ossAccList.length; i++) {
            if (ossAccList[i].ossInfo.domain == gatewayUrl) {
                gatewayAcc = ossAccList[i].account
                break;
            }
        }
        if (!gatewayAcc) {
            console.error("gateway not found")
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
        const token = await GenGatewayAccessToken("https://gateway1.cess.network", {
            account: accountAddress,
            message: sign_message,
            sign: u8aToHex(signature),
            expire: 1
        })

        // step5: upload file to gateway
        const gatewayConfig: GatewayConfig = {
            baseUrl: process.env.CESS_GATEWAY_URL || "https://gateway1.cess.network",
            token: process.env.CESS_GATEWAY_TOKEN || token
        };

        let uploadResult = {} as any
        let fid = ""
        uploadResult = await upload(gatewayConfig, "./src/test/gateway/demo.txt", {
            territory: myTerritory,
            uploadFileWithProgress: (progress) => {
                console.log(`\rUpload progress: ${progress.percentage}% (${progress.loaded}/${progress.total} bytes) - ${progress.file}`);
            }
        });
        fid = uploadResult.data
        console.log("upload result: ", uploadResult)

        // step6: download file from gateway
        const downloadOptions: ExtendedDownloadOptions = {
            fid: fid,
            savePath: "./src/test/gateway/download.txt",
            overwrite: true,
            createDirectories: true,
        };
        const downloadResult = await downloadFile(gatewayConfig, downloadOptions);
        if (downloadResult.success) {
            console.log("download result: ", downloadResult.data)
        } else {
            throw new Error("Failed to download file")
        }

        // step7: query file after a while (gateway is creating storage order)
        // If the queryDealMap func return value is not null, it means that the data is being distributed to storage miners.
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