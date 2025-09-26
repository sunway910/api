// /*
//  * Copyright (C) CESS. All rights reserved.
//  * Copyright (C) Cumulus Encrypted Storage System. All rights reserved.
//  *
//  * SPDX-License-Identifier: Apache-2.0
//  */
//
// import { BlockData, BlockNumberInput, FileDataInBlock, SysSyncState } from '@cessnetwork/types';
// import { BlockNumber, Hash, SignedBlock } from "@polkadot/types/interfaces";
// import { IEvent } from "@polkadot/types/types";
// import { ApiPromise } from "@polkadot/api";
// import { isApiReady } from "@cessnetwork/api/dist/utils/tx";
// export async function parseBlockData(
//     api: ApiPromise,
//     blockNumber: number
// ): Promise<BlockData> {
//     if (!isApiReady(api)) {
//         throw new SDKError('API Client is not ready', 'INVALID_API_CLIENT');
//     }
//
//     const blockHash = await api.rpc.chain.getBlockHash(blockNumber);
//     const signedBlock = await api.rpc.chain.getBlock(blockHash);
//     const apiAt = await api.at(blockHash);
//     const allRecords: any = await apiAt.query.system.events();
//     const header = signedBlock.block.header;
//
//     // A full implementation of this is very complex and requires
//     // detailed knowledge of every extrinsic and event in the CESS runtime.
//     // The following is a partial implementation demonstrating the approach.
//     const blockData: BlockData = {
//         blockHash: blockHash.toHex(),
//         preHash: header.parentHash.toHex(),
//         extHash: header.extrinsicsRoot.toHex(),
//         stHash: header.stateRoot.toHex(),
//         allGasFee: '0', // Calculation requires inspecting treasury events
//         timestamp: 0, // Will be extracted from timestamp.set extrinsic
//         blockId: header.number.toNumber(),
//         isNewEra: false, // Check for staking.NewEra event
//         eraPaid: { haveValue: false, eraIndex: 0, validatorPayout: '0', remainder: '0' },
//         sysEvents: allRecords.map(({ event }: { event: any }) => `${event.section}.${event.method}`),
//         newAccounts: [],
//         genChallenge: [],
//         storageCompleted: [],
//         minerReg: [],
//         extrinsic: [],
//         transferInfo: [],
//         uploadDecInfo: [],
//         deleteFileInfo: [],
//         submitIdleProve: [],
//         submitServiceProve: [],
//         submitIdleResult: [],
//         submitServiceResult: [],
//         punishment: [],
//         minerRegPoisKeys: [],
//         gatewayReg: [],
//         stakingPayouts: [],
//         unbonded: [],
//         mintTerritory: [],
//     };
//
//     // Find timestamp
//     const timestampExtrinsic = signedBlock.block.extrinsics.find(
//         ({ method }) => method.section === 'timestamp' && method.method === 'set'
//     );
//     if (timestampExtrinsic) {
//         blockData.timestamp = Number(timestampExtrinsic.method.args[0].toString());
//     }
//
//     signedBlock.block.extrinsics.forEach((extrinsic, index) => {
//         const { method, signer, isSigned } = extrinsic;
//         const extrinsicName = `${method.section}.${method.method}`;
//
//         const events = allRecords
//             .filter(({ phase }: { phase: any }) => phase.isApplyExtrinsic && phase.asApplyExtrinsic.eq(index))
//             .map(({ event }: { event: any }) => event);
//
//         const isSuccess = events.some((e: IEvent<any>) => api.events.system.ExtrinsicSuccess.is(e));
//
//         if (isSigned) {
//             const info: any = {
//                 name: extrinsicName,
//                 signer: signer.toString(),
//                 hash: extrinsic.hash.toHex(),
//                 feePaid: '0', // Requires fee calculation logic
//                 result: isSuccess,
//                 events: events.map((e: { section: any; method: any; }) => `${e.section}.${e.method}`),
//             };
//             blockData.extrinsic.push(info);
//
//             if (extrinsicName === 'balances.transfer') {
//                 const [to, amount] = method.args;
//                 blockData.transferInfo.push({
//                     extrinsicName: extrinsicName,
//                     extrinsicHash: extrinsic.hash.toHex(),
//                     from: signer.toString(),
//                     to: to.toString(),
//                     amount: amount.toString(),
//                     result: isSuccess,
//                 });
//             }
//
//             if (extrinsicName === 'fileBank.uploadDeclaration') {
//                 const [hash] = method.args;
//                 blockData.uploadDecInfo.push({
//                     extrinsicHash: extrinsic.hash.toHex(),
//                     owner: signer.toString(),
//                     fid: hash.toString(),
//                 });
//             }
//         }
//     });
//
//     return blockData;
// }
//
// export async function parseFileInBlock(
//     api: ApiPromise,
//     blockNumber: number
// ): Promise<FileDataInBlock> {
//     if (!isApiReady(api)) {
//         throw new SDKError('API Client is not ready', 'INVALID_API_CLIENT');
//     }
//
//     const blockHash = await api.rpc.chain.getBlockHash(blockNumber);
//     const signedBlock = await api.rpc.chain.getBlock(blockHash);
//
//     const fileData: FileDataInBlock = {
//         storageCompleted: [],
//         uploadDecInfo: [],
//         deleteFileInfo: [],
//         timestamp: 0,
//         blockId: signedBlock.block.header.number.toNumber(),
//     };
//
//     const timestampExtrinsic = signedBlock.block.extrinsics.find(
//         ({ method }) => method.section === 'timestamp' && method.method === 'set'
//     );
//     if (timestampExtrinsic) {
//         fileData.timestamp = Number(timestampExtrinsic.method.args[0].toString());
//     }
//
//     signedBlock.block.extrinsics.forEach((extrinsic) => {
//         const { method, signer } = extrinsic;
//         const extrinsicName = `${method.section}.${method.method}`;
//
//         if (extrinsicName === 'fileBank.uploadDeclaration') {
//             const [hash] = method.args;
//             fileData.uploadDecInfo.push({
//                 extrinsicHash: extrinsic.hash.toHex(),
//                 owner: signer.toString(),
//                 fid: hash.toString(),
//             });
//         } else if (extrinsicName === 'fileBank.deleteFile') {
//             const [owner, hash] = method.args;
//             fileData.deleteFileInfo.push({
//                 extrinsicHash: extrinsic.hash.toHex(),
//                 owner: owner.toString(),
//                 fid: hash.toString(),
//             });
//         }
//     });
//
//     return fileData;
// }
//
// export async function retrieveEventsByBlockHash(
//     api: ApiPromise,
//     blockHash: Hash
// ): Promise<string[]> {
//     if (!isApiReady(api)) {
//         throw new SDKError('API Client is not ready', 'INVALID_API_CLIENT');
//     }
//     const apiAt = await api.at(blockHash);
//     const allRecords: any = await apiAt.query.system.events();
//     return allRecords.map(({ event }: { event: any }) => `${event.section}.${event.method}`);
// }
//
// export async function retrieveEvents(
//     api: ApiPromise,
//     blockHash: Hash,
//     extrinsicName: string,
//     signer: string
// ): Promise<IEvent<any>[]> {
//     if (!isApiReady(api)) {
//         throw new SDKError('API Client is not ready', 'INVALID_API_CLIENT');
//     }
//
//     const signedBlock = await api.rpc.chain.getBlock(blockHash);
//     const apiAt = await api.at(blockHash);
//     const allRecords: any = await apiAt.query.system.events();
//
//     let foundEvents: IEvent<any>[] = [];
//
//     signedBlock.block.extrinsics.forEach((extrinsic, index) => {
//         const { method, signer: extrinsicSigner } = extrinsic;
//         const currentExtrinsicName = `${method.section}.${method.method}`;
//
//         if (currentExtrinsicName === extrinsicName && extrinsicSigner.toString() === signer) {
//             foundEvents = allRecords
//                 .filter(({ phase }: { phase: any }) => phase.isApplyExtrinsic && phase.asApplyExtrinsic.eq(index))
//                 .map(({ event }: { event: any }) => event);
//         }
//     });
//
//     return foundEvents;
// }