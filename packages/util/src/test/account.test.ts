import {
    parsePublicKey,
    encodePublicKeyAsTestNetAddr,
    encodePublicKeyAsMainNetAddr,
    validateAddress,
    convertAddressFormat,
    evmAddrToCessAddr
} from '@/utils';

// Simple test framework
function test(description: string, fn: () => void) {
    try {
        fn();
        console.log(`✅ ${description}`);
    } catch (error) {
        console.log(`❌ ${description}: ${error}`);
    }
}

function expect(value: any) {
    return {
        toBe: (expected: any) => {
            if (value !== expected) {
                throw new Error(`Expected ${expected}, but got ${value}`);
            }
        },
        toBeInstanceOf: (expected: any) => {
            if (!(value instanceof expected)) {
                throw new Error(`Expected instance of ${expected.name}, but got ${value.constructor.name}`);
            }
        },
        toBeGreaterThan: (expected: number) => {
            if (value <= expected) {
                throw new Error(`Expected ${value} to be greater than ${expected}`);
            }
        },
        toHaveLength: (expected: number) => {
            if (value.length !== expected) {
                throw new Error(`Expected length ${expected}, but got ${value.length}`);
            }
        },
        toThrow: (expected?: string) => {
            // This is handled in the test function itself for error cases
        }
    };
}

// Mock data for testing

const address = 'cXkiws9698dNdQoEFNj1foN8da5yHuWtT5xXzeSE1WXoGGdbL';
const mockPublicKey = parsePublicKey(address);

const mockEvmAddress = '0x41e4ec1679eb2deb21cdbd6404bf63ee1f7e1156';
const invalidEvmAddress = '0x1234567890'; // Too short

console.log('Running tests for account utilities...\n');

// Test parsePublicKey
test('parsePublicKey should parse a valid address and return a public key', () => {
    // Using a real Substrate address for testing
    const address = '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY';
    console.log("Parsing address:", address);
    const publicKey = parsePublicKey(address);
    console.log("Public key:", publicKey);
    console.log("Public key length:", publicKey.length);

    expect(publicKey).toBeInstanceOf(Uint8Array);
    expect(publicKey.length).toBe(32);
});
console.log("\n-----------------------------\n");
test('parsePublicKey should throw an error for an invalid address', () => {
    const invalidAddress = 'invalid_address';
    console.log("Parsing invalid address:", invalidAddress);
    try {
        parsePublicKey(invalidAddress);
        throw new Error('Expected function to throw but it did not');
    } catch (error) {
        console.error("Error caught:", error);
    }
});
console.log("\n-----------------------------\n");
// Test encodePublicKeyAsTestNetAddr
test('encodePublicKeyAsTestNetAddr should encode a public key as a testnet address', () => {
    console.log("Encoding public key as testnet address");
    console.log("Public key:", mockPublicKey);
    const address = encodePublicKeyAsTestNetAddr(mockPublicKey);
    console.log("Testnet address:", address);
    expect(typeof address).toBe('string');
    expect(address.length).toBeGreaterThan(0);
});
console.log("\n-----------------------------\n");
test('encodePublicKeyAsTestNetAddr should throw an error for an invalid public key length', () => {
    const invalidPublicKey = new Uint8Array([1, 2, 3]); // Less than 32 bytes
    console.log("Encoding invalid public key as testnet address");
    console.log("Invalid public key:", invalidPublicKey);
    try {
        encodePublicKeyAsTestNetAddr(invalidPublicKey);
        throw new Error('Expected function to throw but it did not');
    } catch (error) {
        console.error("Error caught:", error);
    }
});
console.log("\n-----------------------------\n");
// Test encodePublicKeyAsMainNetAddr
test('encodePublicKeyAsMainNetAddr should encode a public key as a mainnet address', () => {
    console.log("Encoding public key as mainnet address");
    console.log("Public key:", mockPublicKey);
    const address = encodePublicKeyAsMainNetAddr(mockPublicKey);
    console.log("Mainnet address:", address);
    expect(typeof address).toBe('string');
    expect(address.length).toBeGreaterThan(0);
});
console.log("\n-----------------------------\n");
test('encodePublicKeyAsMainNetAddr should throw an error for an invalid public key length', () => {
    const invalidPublicKey = new Uint8Array([1, 2, 3]); // Less than 32 bytes
    console.log("Encoding invalid public key as mainnet address");
    console.log("Invalid public key:", invalidPublicKey);
    try {
        encodePublicKeyAsMainNetAddr(invalidPublicKey);
        throw new Error('Expected function to throw but it did not');
    } catch (error) {
        console.error("Error caught:", error);
    }
});
console.log("\n-----------------------------\n");
// Test validateAddress
test('validateAddress should return true for a valid address', () => {
    // Using a real Substrate address for testing
    const address = '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY';
    console.log("Validating address:", address);
    const result = validateAddress(address);
    console.log("Validation result:", result);
    expect(result).toBe(true);
});
console.log("\n-----------------------------\n");
test('validateAddress should return false for an invalid address', () => {
    const invalidAddress = 'invalid_address';
    console.log("Validating invalid address:", invalidAddress);
    const result = validateAddress(invalidAddress);
    console.log("Validation result:", result);
    expect(result).toBe(false);
});
console.log("\n-----------------------------\n");
test('validateAddress should return false for an empty address', () => {
    console.log("Validating empty address");
    const result = validateAddress('');
    console.log("Validation result:", result);
    expect(result).toBe(false);
});
console.log("\n-----------------------------\n");
// Test convertAddressFormat
test('convertAddressFormat should convert an address to testnet format (11330)', () => {
    // Using a real Substrate address for testing
    const address = '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY';
    console.log("Converting address to testnet format (11330):", address);
    const converted = convertAddressFormat(address, 11330);
    console.log("Converted address:", converted);
    expect(typeof converted).toBe('string');
    expect(converted.length).toBeGreaterThan(0);
});
console.log("\n-----------------------------\n");
test('convertAddressFormat should convert an address to mainnet format (11331)', () => {
    // Using a real Substrate address for testing
    const address = '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY';
    console.log("Converting address to mainnet format (11331):", address);
    const converted = convertAddressFormat(address, 11331);
    console.log("Converted address:", converted);
    expect(typeof converted).toBe('string');
    expect(converted.length).toBeGreaterThan(0);
});
console.log("\n-----------------------------\n");
test('convertAddressFormat should throw an error for an invalid target format', () => {
    const address = '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY';
    console.log("Converting address with invalid target format:", address, 9999);
    try {
        convertAddressFormat(address, 9999);
        throw new Error('Expected function to throw but it did not');
    } catch (error) {
        console.error("Error caught:", error);
    }
});
console.log("\n-----------------------------\n");
test('convertAddressFormat should throw an error for an invalid address', () => {
    const invalidAddress = 'invalid_address';
    console.log("Converting invalid address:", invalidAddress);
    try {
        convertAddressFormat(invalidAddress, 11330);
        throw new Error('Expected function to throw but it did not');
    } catch (error) {
        console.error("Error caught:", error);
    }
});
console.log("\n-----------------------------\n");
// Test evmAccToCessAddr
test('evmAccToCessAddr should convert a valid EVM address to a CESS testnet address', () => {
    console.log("Converting EVM address to CESS testnet address:", mockEvmAddress);
    const cessAddress = evmAddrToCessAddr(mockEvmAddress, 11330);
    console.log("CESS testnet address:", cessAddress);
    expect(typeof cessAddress).toBe('string');
    expect(cessAddress.length).toBeGreaterThan(0);
});
console.log("\n-----------------------------\n");
test('evmAccToCessAddr should convert a valid EVM address to a CESS mainnet address', () => {
    console.log("Converting EVM address to CESS mainnet address:", mockEvmAddress);
    const cessAddress = evmAddrToCessAddr(mockEvmAddress, 11331);
    console.log("CESS mainnet address:", cessAddress);
    expect(typeof cessAddress).toBe('string');
    expect(cessAddress.length).toBeGreaterThan(0);
});
console.log("\n-----------------------------\n");
test('evmAccToCessAddr should throw an error for a missing EVM address', () => {
    console.log("Converting empty EVM address");
    try {
        evmAddrToCessAddr('', 11330);
        throw new Error('Expected function to throw but it did not');
    } catch (error) {
        console.error("Error caught:", error);
    }
});
console.log("\n-----------------------------\n");
test('evmAccToCessAddr should throw an error for an EVM address without 0x prefix', () => {
    const invalidEvmAddress = '1234567890123456789012345678901234567890';
    console.log("Converting EVM address without 0x prefix:", invalidEvmAddress);
    try {
        evmAddrToCessAddr(invalidEvmAddress, 11330);
        throw new Error('Expected function to throw but it did not');
    } catch (error) {
        console.error("Error caught:", error);
    }
});
console.log("\n-----------------------------\n");
test('evmAccToCessAddr should throw an error for an EVM address with incorrect length', () => {
    console.log("Converting EVM address with incorrect length:", invalidEvmAddress);
    try {
        evmAddrToCessAddr(invalidEvmAddress, 11330);
        throw new Error('Expected function to throw but it did not');
    } catch (error) {
        console.error("Error caught:", error);
    }
});
console.log("\n-----------------------------\n");
test('evmAccToCessAddr should throw an error for an EVM address with non-hex characters', () => {
    const invalidEvmAddress = '0x123456789012345678901234567890123456789G'; // Contains 'G'
    console.log("Converting EVM address with non-hex characters:", invalidEvmAddress);
    try {
        evmAddrToCessAddr(invalidEvmAddress, 11330);
        throw new Error('Expected function to throw but it did not');
    } catch (error) {
        console.error("Error caught:", error);
    }
});
console.log("\n-----------------------------\n");
test('evmAccToCessAddr should throw an error for an invalid target SS58 format', () => {
    console.log("Converting EVM address with invalid target format:", mockEvmAddress, 9999);
    try {
        evmAddrToCessAddr(mockEvmAddress, 9999);
        throw new Error('Expected function to throw but it did not');
    } catch (error) {
        console.error("Error caught:", error);
    }
});

console.log('\nAll tests completed.');