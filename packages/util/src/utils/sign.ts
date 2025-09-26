import { hexToU8a, stringToU8a, u8aConcat, u8aToHex } from '@polkadot/util';
import { keccakAsU8a, mnemonicToMiniSecret, secp256k1Recover, signatureVerify, sr25519PairFromSeed, sr25519Sign } from '@polkadot/util-crypto';
import { parsePublicKey } from './account';
import { calculateSHA256Hash } from "@/utils/hash";

/**
 * Create a sr25519 keypair from a mnemonic for signing
 * @param mnemonic The mnemonic to use for generating the keypair
 * @returns An object containing publicKey and secretKey in the format expected by signing functions
 */
function createKeypairFromMnemonic(mnemonic: string) {
    const miniSecret = mnemonicToMiniSecret(mnemonic);
    const pair = sr25519PairFromSeed(miniSecret);
    return {
        publicKey: pair.publicKey,
        secretKey: pair.secretKey
    };
}

/**
 * Supported signature types
 */
export type SignatureType = 'sr25519' | 'ed25519';


/**
 * Sign a current unix time with a mnemonic using SR25519, can be used for gateway request
 * @param unixTime
 * @param mnemonic The mnemonic to use for signing
 * @returns The signature as Uint8Array
 * @throws Error if the message is empty
 */
export function safeSignUnixTime(unixTime: string | number, mnemonic: string): Uint8Array {
    const keypair = createKeypairFromMnemonic(mnemonic);
    const wrappedMsg = getWrappedMsg(unixTime.toString())
    return sr25519Sign(wrappedMsg, keypair);
}

/**
 * @param unixTime
 * @returns The Uint8Array after concat <Bytes>
 * @throws Error if the unixTime is empty
 */
export function getWrappedMsg(unixTime: string | number): Uint8Array {
    const message_sha256 = calculateSHA256Hash(unixTime.toString())
    const prefix = stringToU8a('<Bytes>');
    const suffix = stringToU8a('</Bytes>');
    return u8aConcat(prefix, message_sha256, suffix);
}


/**
 * Sign a message with a mnemonic using SR25519
 * @param mnemonic The mnemonic to use for signing
 * @param msg The message to sign
 * @returns The signature as Uint8Array
 * @throws Error if the message is empty
 */
export function sr25519SignWithMnemonic(mnemonic: string, msg: string): Uint8Array {
    if (!msg) {
        throw new Error('Empty message');
    }
    const keypair = createKeypairFromMnemonic(mnemonic);
    const message = stringToU8a(msg);
    return sr25519Sign(message, keypair);
}

/**
 * Verify a signature with a public key
 * @param msg The message that was signed
 * @param sign The signature to verify
 * @param account The account (address or public key) to verify against
 * @returns True if the signature is valid, false otherwise
 * @throws Error if the signature is empty
 */
export function verifySignature(msg: Uint8Array | string, sign: Uint8Array, account: string): boolean {
    if (!sign) {
        throw new Error('Empty signature');
    }
    const publicKey = parsePublicKey(account);
    return signatureVerify(msg, sign, publicKey).isValid;
}

/**
 * Parse Ethereum account from Ethereum signature
 * @param message The original message that was signed
 * @param sign The signature (hex format with 0x prefix)
 * @returns The Ethereum address that signed the message
 * @throws Error if the signature length is invalid
 */
export function parseEvmAccFromEvmSign(message: string, sign: string): string {
    try {
        // Validate signature format
        if (!sign.startsWith('0x') || sign.length !== 132) {
            throw new Error('Invalid signature format. Expected 0x + 130 hex characters');
        }

        // Parse signature components
        const signatureBytes = hexToU8a(sign);
        const r = signatureBytes.slice(0, 32);
        const s = signatureBytes.slice(32, 64);
        const v = signatureBytes[64];

        // Create the 64-byte signature (r + s) for secp256k1Recover
        const signature64 = new Uint8Array(64);
        signature64.set(r, 0);
        signature64.set(s, 32);

        // Create Ethereum signed message hash with prefix
        const prefix = stringToU8a('\x19Ethereum Signed Message:\n');
        const messageLength = stringToU8a(message.length.toString());
        const messageBytes = stringToU8a(message);
        const fullMessage = u8aConcat(prefix, messageLength, messageBytes);
        const messageHash = keccakAsU8a(fullMessage);

        // Calculate recovery ID
        const recoveryId = v >= 27 ? v - 27 : v;

        // Recover public key using correct signature format
        const publicKey = secp256k1Recover(messageHash, signature64, recoveryId);

        // Generate Ethereum address from public key
        const publicKeyWithoutPrefix = publicKey.slice(1); // Remove 0x04 prefix
        const addressHash = keccakAsU8a(publicKeyWithoutPrefix);
        return u8aToHex(addressHash.slice(-20));
    } catch (error) {
        throw new Error(`Failed to recover Ethereum address from signature: ${error}`);
    }
}

