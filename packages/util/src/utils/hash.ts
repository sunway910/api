import { createHash } from 'crypto';
import { createReadStream } from 'fs';

export function calculateSHA256Hash(data: string): Buffer {
    const hash = createHash('sha256');
    hash.update(data);
    return hash.digest();
}

export function calcPathSHA256(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const hash = createHash('sha256');
        const stream = createReadStream(filePath);
        stream.on('data', (data) => hash.update(data));
        stream.on('end', () => resolve(hash.digest('hex')));
        stream.on('error', reject);
    });
}

export function calcFileSHA256(stream: NodeJS.ReadableStream): Promise<string> {
    return new Promise((resolve, reject) => {
        const hash = createHash('sha256');
        stream.on('data', (data) => hash.update(data));
        stream.on('end', () => resolve(hash.digest('hex')));
        stream.on('error', reject);
    });
}

export function calcSHA256(data: Buffer): string {
    return createHash('sha256').update(data).digest('hex');
}

export function calcMD5(data: string): string {
    return createHash('md5').update(data).digest('hex');
}

export function calcPathSHA256Bytes(filePath: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        const hash = createHash('sha256');
        const stream = createReadStream(filePath);
        stream.on('data', (data) => hash.update(data));
        stream.on('end', () => resolve(hash.digest()));
        stream.on('error', reject);
    });
}

export function calcFileSHA256Bytes(stream: NodeJS.ReadableStream): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        const hash = createHash('sha256');
        stream.on('data', (data) => hash.update(data));
        stream.on('end', () => resolve(hash.digest()));
        stream.on('error', reject);
    });
}
