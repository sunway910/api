import { randomBytes } from 'crypto';

const BASE_STR = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()[]{}+-*/_=.';

export function getRandomCode(length: number): string {
    let result = '';
    const baseStrLength = BASE_STR.length;
    for (let i = 0; i < length; i++) {
        result += BASE_STR.charAt(Math.floor(Math.random() * baseStrLength));
    }
    return result;
}

export function randStr(n: number): string {
    let result = '';
    const buffer = randomBytes(n);
    for (let i = 0; i < n; i++) {
        result += BASE_STR[buffer[i] % BASE_STR.length];
    }
    return result;
}

export function randSlice<T>(slice: T[]): void {
    for (let i = slice.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [slice[i], slice[j]] = [slice[j], slice[i]];
    }
}

export function extractArray(str: string): number[] {
    const match = str.match(/\d+/g);
    return match ? match.map(Number) : [];
}
