/**
 * Copyright (C) CESS. All rights reserved.
 * Copyright (C) Cumulus Encrypted Storage System. All rights reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import { ApiPromise } from '@polkadot/api';
import { IAudit } from "./chainer/IAudit";
import { IBalances } from "./chainer/IBalances";
import { IOss } from "./chainer/IOss";
import { IFileBank } from "./chainer/file_bank";
import { IStaking } from "./chainer/IStaking";
import { ISystem } from "./chainer/ISystem";
import { ITeeWorker } from "./chainer/tee_worker";
import { ICessTreasury } from "./chainer/cess_treasury";
import { IStorageHandler } from "./chainer/storage_handler";
import { ISession } from "./chainer/ISession";
import { ISminer } from "./chainer/ISminer";
import { KeyringPair } from "@polkadot/keyring/types";

/**
 * CESS client interface
 */
export interface API extends IAudit,
    IBalances,
    IOss,
    IFileBank,
    IStaking,
    ISystem,
    ITeeWorker,
    ICessTreasury,
    IStorageHandler,
    ISession,
    ISminer {

    getSystemChainName(): string

    getSDKName(): string;

    getCurrentRpcAddr(): string;

    setRpcState(state: boolean): void;

    getRpcState(): boolean;

    getSignatureAcc(): string;

    getPublicKey(): Uint8Array;

    getAPI(): ApiPromise;

    getMetadata(): any;

    getTokenSymbol(): string;

    getNetworkEnv(): string;

    getBalances(): bigint;

    setBalances(balance: bigint): void;

    sign(msg: Uint8Array): Promise<Uint8Array>;

    verify(msg: string | Uint8Array, sig: Uint8Array): Promise<boolean>;

    reconnectRpc(): Promise<void>;

    close(): void;

    getKeyring(): KeyringPair | null

    setKeyring(keyring: KeyringPair): Promise<void>

    // Additional properties from ChainClient
    isConnected: boolean;
    currentBalance: bigint;
    currentSignatureAcc: string;
    chainInfo: {
        name: string;
        networkEnv: string;
        tokenSymbol: string;
        tokenDecimals: number;
        ss58Format: number;
        genesisHash: string | undefined;
        runtimeVersion: any;
    };
}