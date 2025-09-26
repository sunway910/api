import { stringToU8a } from "@polkadot/util";
import { xxhashAsU8a, } from '@polkadot/util-crypto';

export function isNil(i: any): boolean {
    return i === null || i === undefined;
}

export function compareSlices(s1: Uint8Array, s2: Uint8Array): boolean {
    if (s1.length !== s2.length) {
        return false;
    }
    for (let i = 0; i < s1.length; i++) {
        if (s1[i] !== s2[i]) {
            return false;
        }
    }
    return true;
}

export function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Create a prefixed storage key
 * @param pallet Module name
 * @param method Method name
 * @returns Prefixed key as Uint8Array
 */
export function createPrefixedKey(pallet: string, method: string): Uint8Array {
    const palletHash = xxhashAsU8a(stringToU8a(pallet), 128);
    const methodHash = xxhashAsU8a(stringToU8a(method), 128);
    return new Uint8Array([...palletHash, ...methodHash]);
}

/**
 * Randomly shuffle an array
 * @param array Array to shuffle
 * @returns A new shuffled array
 */
export function shuffleArray<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
}
