import { decodeAddress, Keyring } from '@polkadot/keyring';
import { blake2AsU8a, encodeAddress } from "@polkadot/util-crypto";
import { stringToU8a, u8aConcat } from '@polkadot/util';
import { AddressSs58Format } from "@cessnetwork/types";

const SS58_PREFIX = new Uint8Array([0x53, 0x53, 0x35, 0x38, 0x50, 0x52, 0x45]);
const CESS_PREFIX = new Uint8Array([0x50, 0xac]);
const EVM_PREFIX = new Uint8Array([0x00]);

/**
 * Parse public key from address
 * @param address The address to decode
 * @returns The public key as Uint8Array
 * @throws Error if failed to decode address
 */
export function parsePublicKey(address: string): Uint8Array {
    try {
        return decodeAddress(address);
    } catch (e) {
        throw new Error('Failed to decode address');
    }
}

/**
 * Encode public key as testnet address (ss58Format: 11330)
 * @param publicKey The public key to encode
 * @returns The testnet address
 * @throws Error if public key is invalid
 */
export function encodePublicKeyAsTestNetAddr(publicKey: Uint8Array): string {
    // Validate public key length
    if (publicKey.length !== 32) {
        throw new Error('Invalid public key length');
    }

    // Validate CESS prefix
    const keyring = new Keyring({type: 'sr25519', ss58Format: AddressSs58Format.TEST_NET});
    return keyring.encodeAddress(publicKey);
}

/**
 * Encode public key as mainnet address (ss58Format: 11331)
 * @param publicKey The public key to encode
 * @returns The mainnet address
 * @throws Error if public key is invalid
 */
export function encodePublicKeyAsMainNetAddr(publicKey: Uint8Array): string {
    // Validate public key length
    if (publicKey.length !== 32) {
        throw new Error('Invalid public key length');
    }

    // Validate CESS prefix
    const keyring = new Keyring({type: 'sr25519', ss58Format: AddressSs58Format.MAIN_NET});
    return keyring.encodeAddress(publicKey);
}

/**
 * Validate address with optional ss58Format check
 * @param address The address to validate
 * @param ss58Format Optional ss58Format to check against
 * @returns True if address is valid, false otherwise
 */
export function validateAddress(address: string, ss58Format?: number): boolean {
    try {
        // Check if address is empty
        if (!address) {
            return false;
        }

        const decoded = parsePublicKey(address);

        // Validate public key length
        if (decoded.length !== 32) {
            return false;
        }

        if (ss58Format !== undefined) {
            const re_encoded = encodeAddress(decoded, ss58Format);
            return re_encoded === address;
        }
        return true;
    } catch {
        return false;
    }
}

/**
 * Convert address to specified ss58Format
 * @param address The address to convert
 * @param targetSs58Format The target ss58 format
 * @returns The converted address
 * @throws Error if address format is invalid
 */
export function convertAddressFormat(address: string, targetSs58Format: number): string {
    // Validate target format
    if (targetSs58Format !== AddressSs58Format.TEST_NET && targetSs58Format !== AddressSs58Format.MAIN_NET) {
        throw new Error('Invalid target SS58 format. Supported formats are 11330 (testnet) and 11331 (mainnet)');
    }

    try {
        const publicKey = parsePublicKey(address);
        return encodeAddress(publicKey, targetSs58Format);
    } catch (e) {
        throw new Error('Invalid address format');
    }
}

/**
 * Convert address from ss58Format 11330 to 11331, cX... -> ce...
 * @param address Address with ss58Format 11330
 * @returns Address with ss58Format 11331
 */
export function convertAddrToMainNet(address: string): string {
    // Validate source format
    if (!validateAddress(address, AddressSs58Format.TEST_NET)) {
        throw new Error('Invalid source address format. Expected testnet address (ss58Format: 11330)');
    }

    try {
        const publicKey = parsePublicKey(address);
        return encodeAddress(publicKey, AddressSs58Format.MAIN_NET);
    } catch (error) {
        throw new Error(`Failed to convert address format to cess mainnet: ${error}`);
    }
}

/**
 * Convert address from ss58Format 11331 to 11330, ce... -> cX...
 * @param address Address with ss58Format 11331
 * @returns Address with ss58Format 11330
 */
export function convertAddrToTestNet(address: string): string {
    // Validate source format
    if (!validateAddress(address, AddressSs58Format.MAIN_NET)) {
        throw new Error('Invalid source address format. Expected mainnet address (ss58Format: 11331)');
    }

    try {
        const publicKey = parsePublicKey(address);
        return encodeAddress(publicKey, AddressSs58Format.TEST_NET);
    } catch (error) {
        throw new Error(`Failed to convert address format to cess testnet: ${error}`);
    }
}

/**
 * Convert Ethereum address to CESS address with specified ss58Format
 * @param evmAddr The Ethereum address (0x prefixed)
 * @param targetSs58Format The target ss58 format (11330 for testnet, 11331 for mainnet)
 * @returns The CESS address in specified format
 * @throws Error if Ethereum address format is invalid
 */
export function evmAddrToCessAddr(evmAddr: string, targetSs58Format: number): string {
    // Validate Ethereum address format
    if (!evmAddr) {
        throw new Error('Ethereum address is required');
    }

    if (!evmAddr.startsWith('0x')) {
        throw new Error('Invalid Ethereum address format: missing 0x prefix');
    }

    if (evmAddr.length !== 42) {
        throw new Error('Invalid Ethereum address length: expected 42 characters');
    }

    const hexPart = evmAddr.slice(2);
    if (!/^[0-9a-fA-F]+$/.test(hexPart)) {
        throw new Error('Invalid Ethereum address format: contains non-hexadecimal characters');
    }

    if (targetSs58Format !== AddressSs58Format.TEST_NET && targetSs58Format !== AddressSs58Format.MAIN_NET) {
        throw new Error('Invalid target SS58 format. Supported formats are 11330 (testnet) and 11331 (mainnet)');
    }

    try {
        const prefix = stringToU8a('evm:');
        const evmAddrBytes = new Uint8Array(Buffer.from(evmAddr.slice(2), 'hex'));

        const combined = u8aConcat(prefix, evmAddrBytes);

        const hash = blake2AsU8a(combined, 256);

        return encodeAddress(hash, targetSs58Format);
    } catch (error) {
        throw new Error(`Failed to convert Ethereum address to CESS address: ${error}`);
    }
}
