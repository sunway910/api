/*
 * Copyright (C) CESS. All rights reserved.
 * Copyright (C) Cumulus Encrypted Storage System. All rights reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import { Bool, Bytes, u8, u32, u64, u128, Option } from '@polkadot/types';
import { AccountId, Hash, Phase } from '@polkadot/types/interfaces';

// Audit
export interface Event_VerifyProof {
    phase: Phase;
    teeWorker: string;
    miner: AccountId;
    topics: Hash[];
}

export interface Event_SubmitProof {
    phase: Phase;
    miner: AccountId;
    topics: Hash[];
}

export interface Event_GenerateChallenge {
    phase: Phase;
    topics: Hash[];
}

export interface Event_SubmitIdleProof {
    phase: Phase;
    miner: AccountId;
    topics: Hash[];
}

export interface Event_SubmitServiceProof {
    phase: Phase;
    miner: AccountId;
    topics: Hash[];
}

export interface Event_SubmitIdleVerifyResult {
    phase: Phase;
    tee: string;
    miner: AccountId;
    result: Bool;
    topics: Hash[];
}

export interface Event_SubmitServiceVerifyResult {
    phase: Phase;
    tee: string;
    miner: AccountId;
    result: Bool;
    topics: Hash[];
}

// Sminer
export interface Event_Registered {
    phase: Phase;
    acc: AccountId;
    topics: Hash[];
}

export interface Event_RegisterPoisKey {
    phase: Phase;
    miner: AccountId;
    topics: Hash[];
}

export interface Event_DrawFaucetMoney {
    phase: Phase;
    topics: Hash[];
}

export interface Event_FaucetTopUpMoney {
    phase: Phase;
    acc: AccountId;
    topics: Hash[];
}

export interface Event_IncreaseCollateral {
    phase: Phase;
    acc: AccountId;
    balance: u128;
    topics: Hash[];
}

export interface Event_Deposit {
    phase: Phase;
    balance: u128;
    topics: Hash[];
}

export interface Event_UpdateBeneficiary {
    phase: Phase;
    acc: AccountId;
    new: AccountId;
    topics: Hash[];
}

export interface Event_UpdatePeerId {
    phase: Phase;
    acc: AccountId;
    old: string;
    new: string;
    topics: Hash[];
}

export interface Event_Receive {
    phase: Phase;
    acc: string;
    reward: u128;
    topics: Hash[];
}

export interface Event_MinerExitPrep {
    phase: Phase;
    miner: AccountId;
    topics: Hash[];
}

// File_bank
export interface Event_DeleteFile {
    phase: Phase;
    operator: AccountId;
    owner: AccountId;
    filehash:Hash[];
    topics: Hash[];
}

export interface Event_FillerDelete {
    phase: Phase;
    acc: AccountId;
    fillerHash:Hash;
    topics: Hash[];
}

export interface Event_FillerUpload {
    phase: Phase;
    acc: AccountId;
    filesize: u64;
    topics: Hash[];
}

export interface Event_UploadDeclaration {
    phase: Phase;
    operator: AccountId;
    owner: AccountId;
    deal_hash:Hash;
    topics: Hash[];
}

export interface Event_CreateBucket {
    phase: Phase;
    acc: AccountId;
    owner: AccountId;
    bucketName: Bytes;
    topics: Hash[];
}

export interface Event_TerritorFileDelivery {
    phase: Phase;
    filehash:Hash;
    newTerritory: Bytes;
    topics: Hash[];
}

export interface Event_DeleteBucket {
    phase: Phase;
    acc: AccountId;
    owner: AccountId;
    bucketName: Bytes;
    topics: Hash[];
}

export interface Event_TransferReport {
    phase: Phase;
    acc: AccountId;
    dealHash:Hash;
    topics: Hash[];
}

export interface Event_ReplaceFiller {
    phase: Phase;
    acc: AccountId;
    filler_list:Hash[];
    topics: Hash[];
}

export interface Event_GenerateRestoralOrder {
    phase: Phase;
    miner: AccountId;
    fragmentHash: Hash;
    topics: Hash[];
}

export interface Event_ClaimRestoralOrder {
    phase: Phase;
    miner: AccountId;
    orderId:Hash;
    topics: Hash[];
}

export interface Event_RecoveryCompleted {
    phase: Phase;
    miner: AccountId;
    orderId:Hash;
    topics: Hash[];
}

export interface Event_StorageCompleted {
    phase: Phase;
    fileHash:Hash;
    topics: Hash[];
}

export interface Event_IncreaseDeclarationSpace {
    phase: Phase;
    miner: AccountId;
    space: u128;
    topics: Hash[];
}

export interface Event_IdleSpaceCert {
    phase: Phase;
    acc: AccountId;
    space: u128;
    topics: Hash[];
}

export interface Event_ReplaceIdleSpace {
    phase: Phase;
    acc: AccountId;
    space: u128;
    topics: Hash[];
}

export interface Event_CalculateReport {
    phase: Phase;
    miner: AccountId;
    fileHash:Hash;
    topics: Hash[];
}

// StorageHandler
export interface Event_BuySpace {
    phase: Phase;
    acc: AccountId;
    storage_capacity: u128;
    spend: u128;
    topics: Hash[];
}

export interface Event_ExpansionSpace {
    phase: Phase;
    acc: AccountId;
    expansion_space: u128;
    fee: u128;
    topics: Hash[];
}

export interface Event_RenewalSpace {
    phase: Phase;
    acc: AccountId;
    renewal_days: u32;
    fee: u128;
    topics: Hash[];
}

// TEE Worker
export interface Event_Exit {
    phase: Phase;
    acc: AccountId;
    topics: Hash[];
}

export interface Event_MasterKeyLaunched {
    phase: Phase;
    topics: Hash[];
}

export interface Event_WorkerAdded {
    phase: Phase;
    pubkey: string;
    attestationProvider: Option<u8>;
    confidenceLevel: u8;
    topics: Hash[];
}

export interface Event_KeyfairyAdded {
    phase: Phase;
    pubkey: string;
    topics: Hash[];
}

export interface Event_WorkerUpdated {
    phase: Phase;
    pubkey: string;
    attestationProvider: Option<u8>;
    confidenceLevel: u8;
    topics: Hash[];
}

export interface Event_MasterKeyRotated {
    phase: Phase;
    rotationId: u64;
    masterPubkey: string;
    topics: Hash[];
}

// Oss
export interface Event_OssRegister {
    phase: Phase;
    acc: AccountId;
    endpoint: string;
    topics: Hash[];
}

export interface Event_OssUpdate {
    phase: Phase;
    acc: AccountId;
    newEndpoint: string;
    topics: Hash[];
}

export interface Event_OssDestroy {
    phase: Phase;
    acc: AccountId;
    topics: Hash[];
}

export interface Event_Authorize {
    phase: Phase;
    acc: AccountId;
    operator: AccountId;
    topics: Hash[];
}

export interface Event_CancelAuthorize {
    phase: Phase;
    acc: AccountId;
    topics: Hash[];
}

// System
export interface Event_TransactionFeePaid {
    phase: Phase;
    who: AccountId;
    actualFee: u128;
    tip: u128;
    topics: Hash[];
}
