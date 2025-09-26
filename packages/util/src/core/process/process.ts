import { promises as fs } from 'fs';
import * as path from 'path';
import { aesCbcEncrypt } from '@/core';
import { reedSolomon } from '@/core';
import { buildMerkleRootHash, buildSimpleMerkleRootHash } from '@/core';
import { calcSHA256, writeFile } from '@/utils';

const SEGMENT_SIZE = 1024 * 1024 * 8; // 8MB

export interface SegmentDataInfo {
    segmentHash: string;
    fragmentHash: string[];
}

export async function fillAndCut(file: string, saveDir: string): Promise<string[]> {
    const stat = await fs.stat(file);
    if (stat.isDirectory()) {
        throw new Error('Not a file');
    }
    if (stat.size === 0) {
        throw new Error('Empty file');
    }
    await fs.mkdir(saveDir, {recursive: true});

    const segmentCount = Math.ceil(stat.size / SEGMENT_SIZE);
    const segments: string[] = [];
    const fileHandle = await fs.open(file, 'r');

    for (let i = 0; i < segmentCount; i++) {
        const buffer = Buffer.alloc(SEGMENT_SIZE);
        const {bytesRead} = await fileHandle.read(buffer, 0, SEGMENT_SIZE, i * SEGMENT_SIZE);
        if (bytesRead < SEGMENT_SIZE) {
            const padding = Buffer.alloc(SEGMENT_SIZE - bytesRead);
            const finalBuffer = Buffer.concat([buffer.slice(0, bytesRead), padding]);
            const hash = calcSHA256(finalBuffer);
            const segmentPath = path.join(saveDir, hash);
            await writeFile(finalBuffer, segmentPath);
            segments.push(segmentPath);
        } else {
            const hash = calcSHA256(buffer);
            const segmentPath = path.join(saveDir, hash);
            await writeFile(buffer, segmentPath);
            segments.push(segmentPath);
        }
    }
    await fileHandle.close();
    return segments;
}

export async function fullProcessing(file: string, cipher: string, saveDir: string): Promise<[SegmentDataInfo[], string]> {
    let segmentList: string[];
    if (cipher) {
        segmentList = await fillAndCutWithAESEncryption(file, cipher, saveDir);
    } else {
        segmentList = await fillAndCut(file, saveDir);
    }

    const segmentInfo: SegmentDataInfo[] = [];
    for (const segment of segmentList) {
        const fragmentHash = await reedSolomon(segment, saveDir);
        segmentInfo.push({segmentHash: path.basename(segment), fragmentHash});
        await fs.unlink(segment);
    }

    const segmentHashes = segmentInfo.map(s => s.segmentHash);
    let fid: string;
    if (segmentHashes.length === 1) {
        fid = buildSimpleMerkleRootHash(segmentHashes[0]);
    } else {
        fid = buildMerkleRootHash(segmentHashes);
    }

    return [segmentInfo, fid];
}

async function fillAndCutWithAESEncryption(file: string, cipher: string, saveDir: string): Promise<string[]> {
    const segments = await fillAndCut(file, saveDir);
    const encryptedSegments: string[] = [];
    for (const segment of segments) {
        const data = await fs.readFile(segment);
        const encryptedData = aesCbcEncrypt(data, Buffer.from(cipher));
        const hash = calcSHA256(encryptedData);
        const encryptedPath = path.join(saveDir, hash);
        await writeFile(encryptedData, encryptedPath);
        encryptedSegments.push(encryptedPath);
        await fs.unlink(segment);
    }
    return encryptedSegments;
}
