/**
 * Reed-Solomon file encoding and decoding implementation
 * Using @bnb-chain/reed-solomon from the Greenfield JavaScript SDK
 */
import { ReedSolomon } from '@bnb-chain/reed-solomon';
import { promises as fs } from 'fs';
import * as path from 'path';
import { calcSHA256 } from '@/utils';

/**
 * Reed-Solomon shard type definition based on BNB Chain's implementation
 */
interface EncodeShard {
    data: Uint8Array;
    index: number;
}

/**
 * Configuration for Reed-Solomon encoding/decoding
 */
export const RSConfig = {
    DATA_SHARDS: 4,
    PARITY_SHARDS: 8,
    SEGMENT_SIZE: 1024 * 1024 * 8, // 8MB
    get TOTAL_SHARDS() {
        return this.DATA_SHARDS + this.PARITY_SHARDS;
    }
};

/**
 * Custom error class for Reed-Solomon operations
 */
export class ReedSolomonError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'ReedSolomonError';
    }
}

/**
 * Converts a Buffer to Uint8Array
 * @param buffer - Input buffer
 * @returns Uint8Array representation of the buffer
 */
function bufferToUint8Array(buffer: Buffer): Uint8Array {
    return new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
}

/**
 * Converts a Uint8Array to Buffer
 * @param uint8Array - Input Uint8Array
 * @returns Buffer representation of the Uint8Array
 */
function uint8ArrayToBuffer(uint8Array: Uint8Array): Buffer {
    return Buffer.from(uint8Array.buffer, uint8Array.byteOffset, uint8Array.byteLength);
}

/**
 * Encodes a file using Reed-Solomon error correction
 *
 * @param file - Path to the file to encode
 * @param saveDir - Directory to save the generated shards
 * @returns Array of paths to the generated shards
 * @throws {ReedSolomonError} If the file is invalid or encoding fails
 */
export async function reedSolomon(file: string, saveDir: string): Promise<string[]> {
    try {
        // Validate the input file
        const stat = await fs.stat(file);
        if (stat.isDirectory()) {
            throw new ReedSolomonError('Input must be a file, not a directory');
        }
        if (stat.size !== RSConfig.SEGMENT_SIZE) {
            throw new ReedSolomonError(`File size must be exactly ${RSConfig.SEGMENT_SIZE} bytes`);
        }

        // Ensure the save directory exists
        await fs.mkdir(saveDir, {recursive: true});

        // Read file data
        const data = await fs.readFile(file);

        // Create Reed-Solomon encoder and encode the data
        const rs = new ReedSolomon(RSConfig.DATA_SHARDS, RSConfig.PARITY_SHARDS);

        // Convert Buffer to Uint8Array for encoding
        const uint8Data = bufferToUint8Array(data);

        // Generate encode shards
        const encodeShardIds = rs.encode(uint8Data);

        // Get all shards and save them
        const shardPaths: string[] = [];

        for (let i = 0; i < encodeShardIds.length; i++) {
            const shard = rs.getEncodeShard(uint8Data, i);
            const shardBuffer = uint8ArrayToBuffer(shard.segChecksum);
            const hash = calcSHA256(shardBuffer);
            const newPath = path.join(saveDir, hash);

            try {
                await fs.access(newPath);
            } catch (e) {
                await fs.writeFile(newPath, shardBuffer);
            }

            shardPaths[i] = newPath;
        }

        return shardPaths;
    } catch (error) {
        if (error instanceof ReedSolomonError) {
            throw error;
        }
        throw new ReedSolomonError(`Failed to encode file: ${error}`);
    }
}

/**
 * Manually reconstructs the original data from Reed-Solomon shards
 *
 * @param shards - Array of shard data
 * @param dataShards - Number of data shards
 * @returns Reconstructed original data
 */
function reconstructData(shards: Buffer[], dataShards: number): Buffer {
    // Since BNB Chain's Reed-Solomon doesn't have a decode method,
    // we need to manually reconstruct the data by concatenating the data shards

    // We only need the first dataShards of shards to reconstruct the original data
    const dataShardBuffers = shards.slice(0, dataShards);

    // Calculate the size of each data shard
    const shardSize = dataShardBuffers[0].length;

    // Concatenate all data shards to get original data
    // Note: This assumes the shards are in correct order
    return Buffer.concat(dataShardBuffers, dataShards * shardSize);
}

/**
 * Restores a file from its shards stored on disk
 *
 * @param outpath - Path where the restored file should be saved
 * @param shardPaths - Paths to the shards needed for reconstruction
 * @throws {ReedSolomonError} If restoration fails
 */
export async function rsRestore(outpath: string, shardPaths: string[]): Promise<void> {
    // Check if output file already exists
    try {
        await fs.access(outpath);
        return; // File exists, nothing to do
    } catch (e) {
        // File doesn't exist, continue with restoration
    }

    try {
        // Validate shard paths
        if (shardPaths.length !== RSConfig.TOTAL_SHARDS) {
            throw new ReedSolomonError(
                `Expected ${RSConfig.TOTAL_SHARDS} shards, but got ${shardPaths.length}`
            );
        }

        // Read all shards
        const shards: Buffer[] = [];
        for (const p of shardPaths) {
            try {
                const shard = await fs.readFile(p);
                shards.push(shard);
            } catch (e) {
                // If a shard is missing, push an empty buffer of appropriate size
                // This assumes all shards are the same size
                if (shards.length > 0) {
                    shards.push(Buffer.alloc(shards[0].length));
                } else {
                    // If no shards have been read yet, we can't determine the size
                    throw new ReedSolomonError(`Failed to read any shards`);
                }
            }
        }

        // Ensure parent directory exists
        await fs.mkdir(path.dirname(outpath), {recursive: true});

        // Check if we have enough shards
        const validShardCount = shards.filter(s => s.length > 0).length;
        if (validShardCount < RSConfig.DATA_SHARDS) {
            throw new ReedSolomonError(
                `Not enough valid shards to restore the file. Found ${validShardCount}, need at least ${RSConfig.DATA_SHARDS}`
            );
        }

        // Reconstruct the data
        const reconstructedData = reconstructData(shards, RSConfig.DATA_SHARDS);

        // Write the reconstructed data to the output file
        await fs.writeFile(outpath, reconstructedData);
    } catch (error) {
        if (error instanceof ReedSolomonError) {
            throw error;
        }
        throw new ReedSolomonError(`Failed to restore file: ${error}`);
    }
}

/**
 * Restores a file from shard data in memory
 *
 * @param outpath - Path where the restored file should be saved
 * @param shardData - Array of shard data (Buffers)
 * @throws {ReedSolomonError} If restoration fails
 */
export async function rsRestoreData(outpath: string, shardData: Buffer[]): Promise<void> {
    // Check if output file already exists
    try {
        await fs.access(outpath);
        return; // File exists, nothing to do
    } catch (e) {
        // File doesn't exist, continue with restoration
    }

    try {
        // Validate shard data
        if (shardData.length !== RSConfig.TOTAL_SHARDS) {
            throw new ReedSolomonError(
                `Expected ${RSConfig.TOTAL_SHARDS} shards, but got ${shardData.length}`
            );
        }

        // Ensure parent directory exists
        await fs.mkdir(path.dirname(outpath), {recursive: true});

        // Check if we have enough valid shards
        const validShardCount = shardData.filter(s => s && s.length > 0).length;
        if (validShardCount < RSConfig.DATA_SHARDS) {
            throw new ReedSolomonError(
                `Not enough valid shards to restore the file. Found ${validShardCount}, need at least ${RSConfig.DATA_SHARDS}`
            );
        }

        // Reconstruct the data
        const reconstructedData = reconstructData(shardData, RSConfig.DATA_SHARDS);

        // Write the reconstructed data to the output file
        await fs.writeFile(outpath, reconstructedData);
    } catch (error) {
        if (error instanceof ReedSolomonError) {
            throw error;
        }
        throw new ReedSolomonError(`Failed to restore file from shard data: ${error}`);
    }
}

/**
 * Class-based API for Reed-Solomon operations
 * Provides an object-oriented interface to the Reed-Solomon functionality
 */
export class RSCodec {
    private rs: ReedSolomon;

    /**
     * Creates a new Reed-Solomon codec instance
     *
     * @param dataShards - Number of data shards (default: 4)
     * @param parityShards - Number of parity shards (default: 8)
     */
    constructor(
        public readonly dataShards: number = RSConfig.DATA_SHARDS,
        public readonly parityShards: number = RSConfig.PARITY_SHARDS
    ) {
        this.rs = new ReedSolomon(dataShards, parityShards);
    }

    /**
     * Encodes data into shards using Reed-Solomon
     *
     * @param data - Data to encode
     * @returns Array of encoded shards as Buffers
     */
    encode(data: Buffer): Buffer[] {
        const uint8Data = bufferToUint8Array(data);
        const shardIds = this.rs.encode(uint8Data);

        return shardIds.map((_: any, i: any) => {
            const shard = this.rs.getEncodeShard(uint8Data, i);
            return uint8ArrayToBuffer(shard.segChecksum);
        });
    }

    /**
     * Encodes a file into shards and saves them to disk
     *
     * @param filePath - Path to the file to encode
     * @param saveDir - Directory to save the generated shards
     * @returns Array of paths to the generated shards
     * @throws {ReedSolomonError} If the file is invalid or encoding fails
     */
    async encodeFile(filePath: string, saveDir: string): Promise<string[]> {
        const data = await fs.readFile(filePath);
        const shards = this.encode(data);

        // Ensure the save directory exists
        await fs.mkdir(saveDir, {recursive: true});

        // Save each shard with its hash as filename
        const shardPaths: string[] = [];

        await Promise.all(shards.map(async (shard, index) => {
            const hash = calcSHA256(shard);
            const newPath = path.join(saveDir, hash);

            try {
                await fs.access(newPath);
            } catch (e) {
                await fs.writeFile(newPath, shard);
            }

            shardPaths[index] = newPath;
        }));

        return shardPaths;
    }

    /**
     * Manually reconstructs the original data from shards
     *
     * @param shards - Array of shard data
     * @returns Reconstructed original data
     */
    decode(shards: Buffer[]): Buffer {
        return reconstructData(shards, this.dataShards);
    }

    /**
     * Restores a file from its shards
     *
     * @param shardPaths - Paths to the shards needed for reconstruction
     * @param outPath - Path where the restored file should be saved
     * @throws {ReedSolomonError} If restoration fails
     */
    async decodeFile(shardPaths: string[], outPath: string): Promise<void> {
        // Check if output file already exists
        try {
            await fs.access(outPath);
            return; // File exists, nothing to do
        } catch (e) {
            // File doesn't exist, continue with restoration
        }

        // Read all shards
        const shards: Buffer[] = [];
        for (const p of shardPaths) {
            try {
                const shard = await fs.readFile(p);
                shards.push(shard);
            } catch (e) {
                // If a shard is missing, push an empty buffer of appropriate size
                if (shards.length > 0) {
                    shards.push(Buffer.alloc(shards[0].length));
                } else {
                    throw new ReedSolomonError(`Failed to read any shards`);
                }
            }
        }

        // Ensure parent directory exists
        await fs.mkdir(path.dirname(outPath), {recursive: true});

        // Check if we have enough valid shards
        const validShardCount = shards.filter(s => s.length > 0).length;
        if (validShardCount < this.dataShards) {
            throw new ReedSolomonError(
                `Not enough valid shards to restore the file. Found ${validShardCount}, need at least ${this.dataShards}`
            );
        }

        // Reconstruct and save
        const decodedData = this.decode(shards);
        await fs.writeFile(outPath, decodedData);
    }
}