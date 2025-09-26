import dotenv from 'dotenv';

dotenv.config();

/**
 * Get mnemonic from environment variables or use default
 * @returns mnemonic string
 */
export function getMnemonic(): string {
    return process.env.CESS_PRIVATE_KEY || "";
}