/**
 * Copyright (C) CESS. All rights reserved.
 * Copyright (C) Cumulus Encrypted Storage System. All rights reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import { AccountBalance, AccountInfoData, SystemProperties } from "@cessnetwork/types";
import { ApiPromise, HttpProvider, Keyring, WsProvider } from '@polkadot/api';
import { KeyringPair } from '@polkadot/keyring/types';
import { Hash, RuntimeVersion, } from '@polkadot/types/interfaces';
import { Metadata, } from '@polkadot/types';
import { formatBalance } from '@polkadot/util';
import { API } from './api';
import type { ProviderInterface } from '@polkadot/rpc-provider/types';
import { encodeAddress } from '@polkadot/util-crypto';
import { SDKError } from "@/utils";
import { Audit } from './chain/audit';
import { Balances } from './chain/balances';
import { Oss } from './chain/oss';
import { FileBank } from './chain/file_bank';
import { Staking } from './chain/staking';
import { System } from './chain/system';
import { Tee_Worker } from './chain/tee_worker';
import { CessTreasury } from './chain/cess_treasury';
import { StorageHandler } from './chain/storage_handler';
import { Session } from './chain/session';
import { Sminer } from './chain/sminer';
import { ChainBase } from './chain/types';
import { isApiReady, isKeyringReady } from "@/utils/tx";

export interface CESSConfig {
    name?: string;
    rpcs: string[];
    privateKey?: string;
    ss58Format?: number;
    connectionTimeout?: number;
    reconnectTimeout?: number;
    maxReconnectAttempts?: number;
    keyringType?: 'sr25519';
    enableEventListener?: boolean;
}

/**
 * CESS ChainClient class implementing Chainer interface
 */
export class CESS extends Sminer(
    StorageHandler(
        CessTreasury(
            Tee_Worker(
                System(
                    Session(
                        Staking(
                            FileBank(
                                Oss(
                                    Balances(
                                        Audit(
                                            ChainBase
                                        )
                                    )
                                )
                            )
                        )
                    )
                )
            )
        )
    )
) implements API {
    // Core API components
    api: ApiPromise | null = null;
    keyring: KeyringPair | null = null;
    private provider: ProviderInterface | null = null;

    // Chain metadata and information
    private metadata: Metadata | null = null;
    private runtimeVersion: RuntimeVersion | null = null;
    private genesisHash: Hash | null = null;
    systemProperties: SystemProperties | null = null;

    // Network configuration
    private readonly rpcAddr: string[];
    private currentRpcAddr: string = '';
    private readonly ss58Format: number;
    private readonly connectionTimeout: number;
    private readonly reconnectTimeout: number;
    private readonly maxReconnectAttempts: number;
    private readonly enableEventListener: boolean | undefined;

    // Chain information
    private tokenSymbol: string = 'TCESS';
    tokenDecimals: number = 18;
    private networkEnv: string = '';
    private chainName: string = '';

    // Account information
    private signatureAcc: string = '';
    private readonly name: string;
    private balance: bigint = BigInt(0);
    private accountInfo: AccountInfoData | null = null;

    // Connection state
    private rpcState: boolean = false;
    private isConnecting: boolean = false;
    private reconnectAttempts: number = 0;
    private connectionPromise: Promise<void> | null = null;

    // Event handling
    private eventListeners: Map<string, Function[]> = new Map();
    private subscriptions: Map<string, () => void> = new Map();

    constructor(config: Partial<CESSConfig> = {}) {
        super();
        this.name = config.name || 'CESS';
        this.rpcAddr = config.rpcs || ["wss://testnet-rpc.cess.network/ws/"];
        this.ss58Format = config.ss58Format || 11330;
        this.connectionTimeout = config.connectionTimeout || 30000; // 30 seconds
        this.reconnectTimeout = config.reconnectTimeout || 5000; // 5 seconds
        this.maxReconnectAttempts = config.maxReconnectAttempts || 3;
        this.enableEventListener = config.enableEventListener || false;

        // Validate configuration
        if (this.rpcAddr.length === 0) {
            throw new Error('At least one RPC address must be provided');
        }
    }

    /**
     * Create a chain client with enhanced error handling and retry logic
     */
    static async newClient(config: CESSConfig): Promise<CESS> {
        const chainClient = new CESS(config);

        try {
            await chainClient.initialize( process.env.CESS_PRIVATE_KEY ||config.privateKey || "");
            return chainClient;
        } catch (error) {
            await chainClient.cleanup();
            throw error;
        }
    }

    /**
     * Initialize the chain client
     */
    private async initialize(
        secretKey?: string,
    ): Promise<void> {
        // Connect to API
        await this.connectToApi();

        // Initialize chain information
        await this.loadChainInfo();

        // Setup account if secretKey provided
        if (secretKey && secretKey.trim() !== '') {
            await this.setupAccount(secretKey);
        }

        // Setup event listeners
        if (this.enableEventListener) {
            this.setupEventListeners();
        }
    }

    /**
     * Connect to API with retry logic and fallback
     */
    private async connectToApi(): Promise<void> {
        if (this.isConnecting) {
            return this.connectionPromise!;
        }

        this.isConnecting = true;
        this.connectionPromise = this.performConnection();

        try {
            await this.connectionPromise;
        } finally {
            this.isConnecting = false;
            this.connectionPromise = null;
        }
    }

    private async performConnection(): Promise<void> {
        let lastError: Error | null = null;

        for (let attempt = 0; attempt <= this.maxReconnectAttempts; attempt++) {
            for (const rpcAddr of this.rpcAddr) {
                try {
                    await this.tryConnectToRpc(rpcAddr);
                    this.currentRpcAddr = rpcAddr;
                    this.rpcState = true;
                    this.reconnectAttempts = 0;
                    return;
                } catch (error) {
                    lastError = error as Error;
                    console.warn(`Failed to connect to RPC ${rpcAddr} (attempt ${attempt + 1}): ${error}`);
                }
            }

            if (attempt < this.maxReconnectAttempts) {
                console.log(`Retrying connection in ${this.reconnectTimeout}ms...`);
                await this.sleep(this.reconnectTimeout);
            }
        }

        throw new Error(`Failed to connect to any RPC after ${this.maxReconnectAttempts + 1} attempts. Last error: ${lastError?.message}`);
    }

    private async tryConnectToRpc(rpcAddr: string): Promise<void> {
        // Determine provider type based on URL
        const isWs = rpcAddr.startsWith('ws://') || rpcAddr.startsWith('wss://');
        const isHttp = rpcAddr.startsWith('http://') || rpcAddr.startsWith('https://');

        if (!isWs && !isHttp) {
            throw new Error(`Invalid RPC address format: ${rpcAddr}`);
        }

        // Create provider
        this.provider = isWs
            ? new WsProvider(rpcAddr)
            : new HttpProvider(rpcAddr);

        // Create API instance with proper timeout handling
        const api = await this.withTimeout(
            ApiPromise.create({provider: this.provider}),
            this.connectionTimeout,
            `Connection timeout to ${rpcAddr}`
        );

        // Wait for API to be ready
        await this.withTimeout(
            api.isReady,
            this.connectionTimeout,
            `API ready timeout for ${rpcAddr}`
        );

        this.api = api;
    }

    private withTimeout<T>(promise: Promise<T>, ms: number, errorMessage: string): Promise<T> {
        let timeoutId: NodeJS.Timeout;

        const timeoutPromise = new Promise<never>((_, reject) => {
            timeoutId = setTimeout(() => reject(new Error(errorMessage)), ms);
        });

        return Promise.race([
            promise.finally(() => clearTimeout(timeoutId)),
            timeoutPromise
        ]) as Promise<T>;
    }

    /**
     * Load chain information
     */
    private async loadChainInfo(): Promise<void> {
        if (!isApiReady(this.api)) {
            throw new SDKError('API Client is not ready', 'INVALID_API_CLIENT');
        }

        try {
            // Load basic chain info
            const [properties, systemChain, genesisHash, runtimeVersion, metadata] = await Promise.all([
                this.api.rpc.system.properties(),
                this.api.rpc.system.chain(),
                this.api.genesisHash,
                this.api.runtimeVersion,
                this.api.runtimeMetadata
            ]);

            // Parse system properties
            this.systemProperties = {
                isEthereum: false,
                tokenSymbol: properties.tokenSymbol?.toJSON() as string[] || ['TCESS'],
                tokenDecimals: properties.tokenDecimals?.toJSON() as number[] || [18],
                ss58Format: Number(properties.ss58Format) || this.ss58Format
            };

            this.tokenSymbol = this.systemProperties?.tokenSymbol[0] || 'TCESS';
            this.tokenDecimals = this.systemProperties?.tokenDecimals[0] || 18;
            this.networkEnv = systemChain.toString();
            this.chainName = systemChain.toString();
            this.genesisHash = genesisHash;
            this.runtimeVersion = runtimeVersion;
            this.metadata = metadata;

            // Set up formatBalance
            formatBalance.setDefaults({
                decimals: this.tokenDecimals,
                unit: this.tokenSymbol
            });

        } catch (error) {
            throw new Error(`Failed to load chain information: ${error}`);
        }
    }

    /**
     * Setup account from secret key which can be mnemonic, hex seed, or development account
     * Supports multiple ways to configure an account:
     * 1. Mnemonic phrase (12 or 24 words)
     * 2. Hex seed (0x prefixed 32-byte hex string)
     * 3. Development account (//Alice, //Bob, etc.)
     */
    private async setupAccount(secretKey: string): Promise<void> {
        if (!isApiReady(this.api)) {
            throw new SDKError('API Client is not ready', 'INVALID_API_CLIENT');
        }

        try {
            const keyring = new Keyring({type: 'sr25519', ss58Format: this.ss58Format});

            // Determine which method to use for setting up the account based on secretKey format
            if (secretKey.startsWith('//')) {
                // Development account (e.g., //Alice, //Bob)
                this.keyring = keyring.addFromUri(secretKey);
            } else if (secretKey.startsWith('0x') && secretKey.length === 66) {
                // Hex seed (0x prefixed 32-byte hex string)
                this.keyring = keyring.addFromUri(secretKey);
            } else if (this.isValidMnemonic(secretKey)) {
                // Mnemonic phrase (12 or 24 words)
                this.keyring = keyring.addFromUri(secretKey);
            } else {
                throw new Error('Invalid secret key format. Must be mnemonic, hex seed (0x...), or development account (//Alice)');
            }

            // Generate account address
            this.signatureAcc = this.keyring.address;

            // Load account information
            await this.updateAccountInfo();

        } catch (error) {
            throw new Error(`Failed to setup account: ${error}`);
        }
    }

    /**
     * Update account balance and information
     */
    async updateAccountInfo(): Promise<void> {
        if (!isApiReady(this.api)) {
            throw new SDKError('API Client is not ready', 'INVALID_API_CLIENT');
        }
        if (!isKeyringReady(this.keyring)) {
            throw new SDKError('Keyring Pair is required', 'INVALID_KEYRING');
        }

        try {
            const accountInfo = await this.api.query.system.account(this.keyring.address)
            const result = accountInfo.toJSON() as any;
            if (!this.accountInfo) {
                return
            } else {
                this.accountInfo = {
                    nonce: Number(result.nonce),
                    consumers: Number(result.consumers),
                    providers: Number(result.providers),
                    sufficients: Number(result.sufficients),
                    data: {
                        free: BigInt(result.data.free),
                        reserved: BigInt(result.data.reserved),
                        frozen: BigInt(result.data.frozen),
                        flags: BigInt(result.data.flags),
                    } as unknown as AccountBalance
                } as unknown as AccountInfoData;
            }
            this.balance = this.accountInfo.data.free;
        } catch (error) {
            console.warn(`Failed to update account info: ${error}`);
            this.balance = BigInt(0);
        }
    }

    /**
     * Setup event listeners for connection monitoring
     */
    private setupEventListeners(): void {
        if (!this.provider) return;

        this.provider.on('connected', () => {
            this.rpcState = true;
            this.emit('connected', this.currentRpcAddr);
        });

        this.provider.on('disconnected', () => {
            this.rpcState = false;
            this.emit('disconnected', this.currentRpcAddr);
            this.handleDisconnection().then();
        });

        this.provider.on('error', (error) => {
            this.emit('error', error);
        });
    }

    /**
     * Handle connection disconnection with auto-reconnect
     */
    private async handleDisconnection(): Promise<void> {
        if (this.isConnecting) return;

        console.log('Connection lost, attempting to reconnect...');

        try {
            await this.sleep(this.reconnectTimeout);
            await this.connectToApi();
            console.log('Reconnected successfully');
        } catch (error) {
            console.error('Failed to reconnect:', error);
            this.emit('reconnectFailed', error);
        }
    }

    // Utility methods
    private timeout<T>(ms: number, message: string): Promise<T> {
        return new Promise((_, reject) =>
            setTimeout(() => reject(new Error(message)), ms)
        );
    }

    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    private isValidMnemonic(mnemonic: string): boolean {
        const words = mnemonic.trim().split(/\s+/);
        return words.length === 12 || words.length === 24;
    }

    // Event emitter methods
    on(event: string, callback: Function): void {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, []);
        }
        this.eventListeners.get(event)!.push(callback);
    }

    off(event: string, callback: Function): void {
        const listeners = this.eventListeners.get(event);
        if (listeners) {
            const index = listeners.indexOf(callback);
            if (index !== -1) {
                listeners.splice(index, 1);
            }
        }
    }

    private emit(event: string, ...args: any[]): void {
        const listeners = this.eventListeners.get(event);
        if (listeners) {
            listeners.forEach(callback => {
                try {
                    callback(...args);
                } catch (error) {
                    console.error(`Error in event listener for '${event}':`, error);
                }
            });
        }
    }

    // Keyring getter and setter
    /**
     * Get keyring pair
     * @returns KeyringPair or null
     */
    getKeyring(): KeyringPair | null {
        return this.keyring;
    }

    /**
     * Set keyring pair
     * @param keyring KeyringPair
     */
    async setKeyring(keyring: KeyringPair): Promise<void> {
        this.keyring = keyring;
        // Update signature account address when keyring is set
        if (keyring) {
            this.signatureAcc = encodeAddress(keyring.publicKey, this.ss58Format);
            // Update account information and balance
            await this.updateAccountInfo().then();
        }
    }

    // Getters for accessing private properties
    get isConnected(): boolean {
        return this.rpcState && (this.api ? this.api.isConnected : false);
    }

    get currentBalance(): bigint {
        return this.balance;
    }

    get currentSignatureAcc(): string {
        return this.signatureAcc;
    }

    get chainInfo() {
        return {
            name: this.chainName,
            networkEnv: this.networkEnv,
            tokenSymbol: this.tokenSymbol,
            tokenDecimals: this.tokenDecimals,
            ss58Format: this.ss58Format,
            genesisHash: this.genesisHash?.toHex(),
            runtimeVersion: this.runtimeVersion?.toJSON()
        };
    }

    /**
     * Cleanup resources
     */
    async cleanup(): Promise<void> {
        // Unsubscribe from all subscriptions
        for (const [, unsubscribe] of this.subscriptions) {
            try {
                unsubscribe();
            } catch (error) {
                console.warn('Error unsubscribing:', error);
            }
        }
        this.subscriptions.clear();

        // Disconnect API
        if (this.api) {
            try {
                await this.api.disconnect();
            } catch (error) {
                console.warn('Error disconnecting API:', error);
            }
            this.api = null;
        }

        // Disconnect provider
        if (this.provider) {
            try {
                await this.provider.disconnect();
            } catch (error) {
                console.warn('Error disconnecting provider:', error);
            }
            this.provider = null;
        }

        // Clear state
        this.rpcState = false;
        this.eventListeners.clear();
    }

    /**
     * Get system chain name
     * @returns Chain name
     */
    getSystemChainName(): string {
        return this.chainName;
    }

    /**
     * Get SDK name
     * @returns SDK name
     */
    getSDKName(): string {
        return this.name;
    }

    /**
     * Get current RPC address
     * @returns Current RPC address
     */
    getCurrentRpcAddr(): string {
        return this.currentRpcAddr;
    }

    /**
     * Set RPC connection state
     * @param state RPC state
     */
    setRpcState(state: boolean): void {
        this.rpcState = state;
    }

    /**
     * Get RPC connection state
     * @returns RPC state
     */
    getRpcState(): boolean {
        return this.rpcState;
    }

    /**
     * Get signature account address
     * @returns Signature account address
     */
    getSignatureAcc(): string {
        return this.signatureAcc;
    }

    /**
     * Get signature account public key
     * @returns Signature account public key
     */
    getPublicKey(): Uint8Array {
        return this.keyring ? this.keyring.publicKey : new Uint8Array();
    }

    /**
     * Get Substrate API
     * @returns Substrate API
     */
    getAPI(): ApiPromise {
        if (!isApiReady(this.api)) {
            throw new SDKError('API Client is not ready', 'INVALID_API_CLIENT');
        }
        return this.api;
    }

    /**
     * Get metadata
     * @returns Metadata
     */
    getMetadata(): any {
        return this.metadata?.toHuman();
    }

    /**
     * Get token symbol
     * @returns Token symbol
     */
    getTokenSymbol(): string {
        return this.tokenSymbol;
    }

    /**
     * Get network environment
     * @returns Network environment
     */
    getNetworkEnv(): string {
        return this.networkEnv;
    }

    /**
     * Get balance
     * @returns Balance
     */
    getBalances(): bigint {
        return this.balance;
    }

    /**
     * Set balance
     * @param balance Balance
     */
    setBalances(balance: bigint): void {
        this.balance = balance;
    }

    /**
     * Sign message
     * @param msg Message
     * @returns Signature
     */
    async sign(msg: Uint8Array): Promise<Uint8Array> {
        if (!this.keyring) {
            throw new Error('No keyring available');
        }
        return this.keyring.sign(msg);
    }

    /**
     * Verify signature
     * @param msg Message
     * @param signature Signature
     * @returns Verification result
     */
    async verify(msg: string | Uint8Array, signature: Uint8Array): Promise<boolean> {
        if (!this.keyring) {
            throw new Error('No keyring available');
        }
        return this.keyring.verify(msg, signature, this.keyring.publicKey);
    }

    /**
     * Reconnect RPC
     * @returns void
     */
    async reconnectRpc(): Promise<void> {
        if (this.getRpcState()) {
            return;
        }

        if (this.api) {
            try {
                await this.api.rpc.chain.getHeader();
                this.setRpcState(true);
                return;
            } catch (e) {
                // Connection failed, try to reconnect
            }
        }

        if (this.api) {
            await this.api.disconnect();
            this.api = null;
        }

        // Reconnect
        const result = await this.reconnectRpcInternal(this.currentRpcAddr, this.rpcAddr);
        if (result.error) {
            return;
        }

        this.api = result.api;
        this.metadata = result.metadata;
        this.runtimeVersion = result.runtimeVersion;
        this.genesisHash = result.genesisHash;
        this.currentRpcAddr = result.rpcAddr;
        this.setRpcState(true);
    }

    /**
     * Internal RPC reconnection implementation
     * @param oldRpc Old RPC address
     * @param rpcs RPC address list
     * @returns Connection result
     */
    private async reconnectRpcInternal(oldRpc: string, rpcs: string[]): Promise<{
        api: ApiPromise | null;
        metadata: any;
        runtimeVersion: RuntimeVersion | null;
        genesisHash: Hash | null;
        rpcAddr: string;
        error?: Error;
    }> {
        let rpcAddr = '';
        let api: ApiPromise | null = null;

        // Put current RPC at the end of the list, prioritize other RPCs
        let rpcAddrList: string[] = [];

        for (const rpc of rpcs) {
            if (rpc !== oldRpc) {
                rpcAddrList.push(rpc);
            }
        }
        rpcAddrList.push(oldRpc);

        // Try to connect to each RPC
        for (const rpc of rpcAddrList) {
            try {
                const provider = new WsProvider(rpc);
                api = await ApiPromise.create({provider});
                rpcAddr = rpc;
                break;
            } catch (e) {
                console.error(`Failed to connect to RPC ${rpc}: ${e}`);
            }
        }

        if (!api) {
            return {
                api: null,
                metadata: null,
                runtimeVersion: null,
                genesisHash: null,
                rpcAddr: '',
                error: new SDKError('API Client is not ready', 'INVALID_API_CLIENT')
            };
        }

        // Get metadata and other information
        try {
            const metadata = await api.rpc.state.getMetadata();
            const genesisHash = await api.rpc.chain.getBlockHash(0);
            const runtimeVersion = await api.rpc.state.getRuntimeVersion();

            return {
                api,
                metadata,
                runtimeVersion,
                genesisHash,
                rpcAddr
            };
        } catch (e) {
            if (api) {
                await api.disconnect();
            }

            return {
                api: null,
                metadata: null,
                runtimeVersion: null,
                genesisHash: null,
                rpcAddr: '',
                error: new SDKError('API Client is not ready', 'INVALID_API_CLIENT')
            };
        }
    }

    /**
     * Close connection
     */
    async close(): Promise<void> {
        // Clear all event listeners
        this.eventListeners.clear();

        // Unsubscribe from all subscriptions
        for (const [, unsubscribe] of this.subscriptions) {
            try {
                unsubscribe();
            } catch (error) {
                console.warn('Error unsubscribing:', error);
            }
        }
        this.subscriptions.clear();

        // Disconnect provider if it exists
        if (this.provider) {
            try {
                // For WebSocket providers, we need to properly disconnect
                if (typeof (this.provider as any).disconnect === 'function') {
                    await (this.provider as any).disconnect();
                }
            } catch (error) {
                console.warn('Error disconnecting provider:', error);
            }
            this.provider = null;
        }

        // Disconnect API if it exists
        if (this.api) {
            try {
                await this.api.disconnect();
            } catch (error) {
                console.warn('Error disconnecting API:', error);
            }
            this.api = null;
        }

        // Reset connection state
        this.rpcState = false;
        this.isConnecting = false;
    }
}