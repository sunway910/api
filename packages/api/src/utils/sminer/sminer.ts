import { DownloadFileReq, DownloadFragmentReq, DownloadSegmentReq, MinerInfo } from "@cessnetwork/types";
import path from "path";
import { promises as fs } from "fs";
import { aesCbcDecrypt, rsRestore, writeFile } from "@cessnetwork/util";
import { CESS } from "@/cess";

const SEGMENT_SIZE = 1024 * 1024 * 8; // 8MB
const FRAGMENT_SIZE = 1024 * 1024; // 1MB
const DATA_SHARDS = 4;

async function downloadFileFromSminer(cli: CESS, downloadFileReq: DownloadFileReq): Promise<string> {
    const userfile = path.join(downloadFileReq.savePath, downloadFileReq.fid);
    try {
        const stat = await fs.stat(userfile);
        if (stat.size > 0) {
            return userfile;
        }
    } catch (e) {
        // file does not exist, which is what we want
    }
    await fs.mkdir(downloadFileReq.savePath, {recursive: true});

    const segmentsDir = path.join(downloadFileReq.savePath, 'segments');
    await fs.mkdir(segmentsDir, {recursive: true});

    try {
        const segmentPaths: string[] = [];
        for (const segment of downloadFileReq.fmeta.segmentList) {
            const segmentPath = await downloadSegmentFromSminer(
                cli,
                {
                    savePath: segmentsDir,
                    fid: downloadFileReq.fid,
                    segmentHash: segment.hash,
                    fragments: segment.fragmentList,
                    signData: {
                        account: downloadFileReq.signData.account,
                        message: downloadFileReq.signData.message,
                        sign: downloadFileReq.signData.sign
                    }
                }
            );
            segmentPaths.push(segmentPath);
        }

        const fd = await fs.open(userfile, 'w');
        let writeCount = 0;
        for (const segmentPath of segmentPaths) {
            let data = await fs.readFile(segmentPath);
            if (downloadFileReq.cipher) {
                data = aesCbcDecrypt(data, Buffer.from(downloadFileReq.cipher));
            }
            if (writeCount + 1 >= downloadFileReq.fmeta.segmentList.length) {
                await fd.write(data, 0, Number(downloadFileReq.fmeta.fileSize.toString()) - Number(writeCount * SEGMENT_SIZE));
            } else {
                await fd.write(data);
            }
            writeCount++;
        }
        await fd.close();
        return userfile;
    } finally {
        await fs.rm(segmentsDir, {recursive: true, force: true});
    }
}

async function downloadSegmentFromSminer(cli: CESS, downloadSegmentReq: DownloadSegmentReq): Promise<string> {
    const fragmentPaths: string[] = [];
    const segmentPath = path.join(downloadSegmentReq.savePath, downloadSegmentReq.segmentHash);

    for (const fragment of downloadSegmentReq.fragments) {
        if (fragmentPaths.length >= DATA_SHARDS) {
            break;
        }
        const fragmentPath = path.join(downloadSegmentReq.savePath, fragment.hash);
        try {
            const stat = await fs.stat(fragmentPath);
            if (stat.size === FRAGMENT_SIZE) {
                fragmentPaths.push(fragmentPath);
                continue;
            }
        } catch (e) {
            throw new Error(`Download failed with status code ${fragment.hash}: ${e}`);
        }
        try {
            const minerInfo = await cli.queryMinerByAccountId(fragment.miner) as MinerInfo;
            const endpoint = minerInfo?.endpoint ? minerInfo?.endpoint : ''
            const data = await downloadFragmentFromSMiner(
                {
                    minerEndpoint: endpoint,
                    fid: downloadSegmentReq.fid,
                    fragmentHash: fragment.hash,
                    signData: {
                        account: downloadSegmentReq.signData.account,
                        message: downloadSegmentReq.signData.message,
                        sign: downloadSegmentReq.signData.sign
                    }
                }
            );
            await writeFile(data, fragmentPath);
            fragmentPaths.push(fragmentPath);
        } catch (e) {
            console.error(`Failed to download fragment ${fragment.hash} from miner ${fragment.miner}:`, e);
        }
    }
    await rsRestore(segmentPath, fragmentPaths);
    return segmentPath;
}

async function downloadFragmentFromSMiner(downloadFragmentReq: DownloadFragmentReq): Promise<Buffer> {
    let url = downloadFragmentReq.minerEndpoint;
    if (url.endsWith('/')) {
        url += 'fragment';
    } else {
        url += '/fragment';
    }
    if (!url.startsWith('http://')) {
        url = `http://${url}`;
    }

    // Create AbortController for timeout functionality
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Fid': downloadFragmentReq.fid,
                'Fragment': downloadFragmentReq.fragmentHash,
                'Account': downloadFragmentReq.signData.account,
                'Message': downloadFragmentReq.signData.message,
                'Signature': downloadFragmentReq.signData.sign,
            },
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`Download failed with status code ${response.status}: ${response.statusText}`);
        }

        // Get ArrayBuffer from response and convert to Buffer
        const arrayBuffer = await response.arrayBuffer();
        return Buffer.from(arrayBuffer);

    } catch (error) {
        clearTimeout(timeoutId);

        if (error instanceof Error) {
            if (error.name === 'AbortError') {
                throw new Error('Request timeout: No response received within 30 seconds');
            } else if (error.message.includes('fetch')) {
                throw new Error('Network error: No response received from server');
            } else {
                throw new Error(`Request error: ${error.message}`);
            }
        }
        throw error;
    }
}

export { downloadFileFromSminer, downloadSegmentFromSminer, downloadFragmentFromSMiner };