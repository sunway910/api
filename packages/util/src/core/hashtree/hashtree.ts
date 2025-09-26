import { MerkleTree } from 'merkletreejs';
import { createHash } from 'crypto';
import { promises as fs } from 'fs';
import { calcSHA256 } from '@/utils';

function sha256(data: Buffer): Buffer {
    return createHash('sha256').update(data).digest();
}

export async function newHashTree(chunkPaths: string[]): Promise<MerkleTree> {
    if (chunkPaths.length === 0) {
        throw new Error('Empty data');
    }
    const leaves = await Promise.all(chunkPaths.map(p => fs.readFile(p)));
    return new MerkleTree(leaves, sha256);
}

export function buildMerkleRootHash(segmentHashes: string[]): string {
    if (segmentHashes.length === 0) {
        throw new Error('Empty segment hash');
    }
    if (segmentHashes.length === 1) {
        return segmentHashes[0];
    }

    const hashList: string[] = [];
    for (let i = 0; i < segmentHashes.length; i += 2) {
        if (i + 1 >= segmentHashes.length) {
            const b = Buffer.from(segmentHashes[i], 'hex');
            const hash = calcSHA256(Buffer.concat([b, b]));
            hashList.push(hash);
        } else {
            const b1 = Buffer.from(segmentHashes[i], 'hex');
            const b2 = Buffer.from(segmentHashes[i + 1], 'hex');
            const hash = calcSHA256(Buffer.concat([b1, b2]));
            hashList.push(hash);
        }
    }
    return buildMerkleRootHash(hashList);
}

export function buildSimpleMerkleRootHash(segmentHash: string): string {
    const b = Buffer.from(segmentHash, 'hex');
    return calcSHA256(Buffer.concat([b, b]));
}
