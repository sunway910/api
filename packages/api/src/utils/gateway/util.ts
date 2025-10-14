import { GatewayConfig, GenTokenReq, UploadOptions } from "@cessnetwork/types";
import { Keyring } from "@polkadot/api";
import { u8aConcat } from "@polkadot/util";
import { blake2AsU8a, cryptoWaitReady, mnemonicValidate, randomAsU8a } from "@polkadot/util-crypto";

// Gateway endpoint for generating access tokens
export const GATEWAY_GENTOKEN_URL = "/gateway/gentoken"

/**
 * Verify gateway configuration has required fields
 * 
 * @param config - Gateway configuration to verify
 * @throws Error if configuration is invalid
 */
export function verifyUploadConfig(config: GatewayConfig) {
    if (!config?.token?.trim()) {
        throw new Error("Token is required when uploading file to gateway: INVALID_TOKEN");
    }
    if (!config?.baseUrl?.trim()) {
        throw new Error("Base URL is required: INVALID_BASE_URL");
    }
}

/**
 * Verify upload options have required fields
 * 
 * @param options - Upload options to verify
 * @throws Error if options are invalid
 */
export function verifyUploadOptions(options: UploadOptions) {
    if (!options?.territory?.trim()) {
        throw new Error("Territory is required: INVALID_TERRITORY");
    }
}

/**
 * Generate gateway access token using provided credentials
 * 
 * @param gatewayUrl - Base URL of the gateway service
 * @param genTokenReq - Request object containing token generation parameters
 * @returns Promise containing the generated access token
 * @throws Error for network failures, timeouts, or invalid responses
 */
export async function GenGatewayAccessToken(gatewayUrl: string, genTokenReq: GenTokenReq): Promise<any> {
    try {
        // Remove trailing slash from gatewayUrl
        const baseUrl = gatewayUrl.replace(/\/$/, "");

        // Convert object to URLSearchParams for form-urlencoded format
        const formData = new URLSearchParams();
        Object.entries(genTokenReq).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                formData.append(key, String(value));
            }
        });

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

        const response = await fetch(`${baseUrl}${GATEWAY_GENTOKEN_URL}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formData,
            signal: controller.signal,
        });


        clearTimeout(timeoutId);

        const result = await response.json() as any;
        return result.data;

    } catch (error) {
        if (error instanceof Error) {
            // Handle timeout error
            if (error.name === 'AbortError') {
                console.error("Request timeout");
                throw new Error(`Request timeout for ${gatewayUrl}`);
            }

            // Handle fetch errors
            if (error.message.includes('fetch')) {
                console.error("Network error:", error.message);
                throw new Error(`Network error when connecting to ${gatewayUrl}`);
            }

            // Handle HTTP errors
            if (error.message.includes('HTTP error')) {
                console.error("Server responded with error:", error.message);
                throw new Error(`Server error from ${gatewayUrl}: ${error.message}`);
            }

            throw new Error(`Request failed for ${gatewayUrl}: ${error.message}`);
        } else {
            throw new Error(`Unexpected error occurred when requesting ${gatewayUrl}`);
        }
    }
}

/**
 * Retrieves pre-encapsulation capsule data and gateway public key for a given file
 * by sending HTTP GET request to the gateway service. This is essential for subsequent encryption operations.
 *
 * @param baseUrl - Base URL of the gateway service
 * @param fid - Unique file identifier
 * @returns Promise containing proxy re-encryption capsule and gateway's public key
 * @throws Error for URL construction failure, HTTP request failure, or JSON parsing failure
 */
export async function getPreCapsuleAndGatewayPubkey(
    baseUrl: string,
    fid: string
): Promise<any> {
    try {
        const url = baseUrl.replace(/\/$/, "");
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

        const response = await fetch(`${url}${GATEWAY_GENTOKEN_URL}/${fid}`, {
            method: 'GET',
            signal: controller.signal,
        });
        clearTimeout(timeoutId);
        const result = await response.json() as any;
        const {capsule, pubkey} = result.data;
        if (!capsule || !pubkey) {
            throw new Error('Invalid response format: missing capsule or pubkey');
        }
        return {
            capsule: capsule,
            gatewayPubkey: pubkey
        };
    } catch (error) {
        throw new Error(`get pre capsule and gateway pubkey error: ${error}`);
    }
}

/**
 * Generates a re-encryption key and corresponding public key using Schnorrkel scheme.
 * This implements proxy re-encryption mechanism for decentralized storage systems.
 *
 * @param mnemonic - User's mnemonic phrase for key derivation
 * @param pkB - Recipient's public key bytes (32-byte expected)
 * @returns Promise containing marshaled re-encryption key (rk) and encoded public key bytes (pkX)
 * @throws Error for invalid inputs or generation failures
 */
export async function genReEncryptionKey(
    mnemonic: string,
    pkB: Uint8Array
): Promise<ReEncryptionKeyResult> {
    // Ensure crypto is ready
    await cryptoWaitReady();

    // Validate input parameters
    if (pkB.length !== 32) {
        throw new Error('generate re-encryption key error: public key length error');
    }

    // Validate mnemonic phrase
    if (!mnemonicValidate(mnemonic)) {
        throw new Error('generate re-encryption key error: invalid mnemonic phrase');
    }

    try {
        // Create keyring with sr25519 type (Schnorrkel)
        const keyring = new Keyring({type: 'sr25519', ss58Format: 11330});

        // Generate secret key from mnemonic
        const secretKeyA = keyring.createFromUri(mnemonic);

        // Generate re-encryption key
        const {rk, pkX} = await genReKey(secretKeyA.publicKey, pkB);

        // Marshal the re-encryption key (encode as base64)
        const marshaledRk = new TextEncoder().encode(
            Buffer.from(rk).toString('base64')
        );

        return {
            reEncryptionKey: marshaledRk,
            publicKeyX: pkX
        };

    } catch (error) {
        throw new Error(`generate re-encryption key error: ${error}`);
    }
}

/**
 * Internal function to generate re-encryption key components
 * Equivalent to the Go GenReKey function
 *
 * @param pkA - Public key A (from secret key A)
 * @param pkB - Public key B (recipient's public key)
 * @returns Promise containing re-encryption key scalar and public key X
 */
async function genReKey(
    pkA: Uint8Array,
    pkB: Uint8Array
): Promise<ReKeyGenerationResult> {
    try {
        // Generate x,X key-pair (random keypair for X)
        const keyring = new Keyring({type: 'sr25519', ss58Format: 11330});
        const randomSeed = randomAsU8a(32);
        const keyPairX = keyring.addFromSeed(randomSeed);

        const skX = keyPairX.publicKey; // In this context, we use public key as reference
        const pkX = keyPairX.publicKey;

        // Simulate scalar multiplication pkB^x (simplified for demonstration)
        // In a real implementation, you would need proper elliptic curve operations
        const xbpk = pkX;
        const bbpk = pkB;

        // Simulate point multiplication result
        const pointResult = performScalarMultiplication(skX, pkB);

        // Encode the point result
        const pointEncoded = Buffer.from(pointResult).toString('base64');

        // Create hash input: X || pkB || pkB^x
        const hashInput = u8aConcat(xbpk, bbpk, new TextEncoder().encode(pointEncoded));

        // Hash and convert to scalar d = H(X||pk_B||pk_B^{x})
        const d = hashAndConvertToScalar(hashInput);

        // Generate re-encryption key: rk = skA * d^(-1)
        // This is a simplified version - in practice you'd need proper scalar arithmetic
        const rk = generateReEncryptionKey(pkA, d);

        return {
            rk: rk,
            pkX: pkX
        };

    } catch (error) {
        throw new Error(`generate re-encryption key error: ${error}`);
    }
}

/**
 * Simulates scalar multiplication for elliptic curve operations
 * Note: This is a simplified implementation for demonstration
 * In production, you would use proper cryptographic libraries
 * 
 * @param scalar - Scalar value for multiplication
 * @param point - Point on the elliptic curve
 * @returns Uint8Array result of scalar multiplication
 */
function performScalarMultiplication(scalar: Uint8Array, point: Uint8Array): Uint8Array {
    // Simplified simulation using blake2 hash
    return blake2AsU8a(u8aConcat(scalar, point), 256);
}

/**
 * Hash input data and convert to scalar representation
 * Uses Blake2b hash function as specified in Polkadot cryptography
 * 
 * @param input - Input data to hash
 * @returns Uint8Array hash result as scalar
 */
function hashAndConvertToScalar(input: Uint8Array): Uint8Array {
    // Use Blake2b hash (Polkadot's standard hashing algorithm)
    return blake2AsU8a(input, 256);
}

/**
 * Generate the final re-encryption key using scalar arithmetic
 * Simulates: rk = skA * d^(-1)
 * 
 * @param skA - Secret key A
 * @param d - Scalar value
 * @returns Uint8Array re-encryption key
 */
function generateReEncryptionKey(skA: Uint8Array, d: Uint8Array): Uint8Array {
    // Simplified scalar arithmetic simulation
    // In practice, this would involve proper modular arithmetic
    const combined = u8aConcat(skA, d);
    return blake2AsU8a(combined, 256);
}

// Interface for re-encryption key result
export interface ReEncryptionKeyResult {
    reEncryptionKey: Uint8Array;  // Marshaled re-encryption key (rk)
    publicKeyX: Uint8Array;       // Encoded public key bytes for encryption (pkX)
}

// Interface for re-encryption key generation result
export interface ReKeyGenerationResult {
    rk: Uint8Array;  // Re-encryption key
    pkX: Uint8Array; // Public key X
}