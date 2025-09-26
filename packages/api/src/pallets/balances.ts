/*
 * Copyright (C) CESS. All rights reserved.
 * Copyright (C) Cumulus Encrypted Storage System. All rights reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import { SDKError } from "@/utils";
import { calculatePaymentInfo, executeTransaction, normalizeTransactionOptions, TransactionOptions, TransactionResult } from "@/utils/tx";
import { AccountIdInput, AccountLock, BalanceInput, BlockNumberInput, MultiAddressInput } from "@cessnetwork/types";
import { ApiPromise } from '@polkadot/api';
import { SubmittableExtrinsic } from "@polkadot/api/types";
import { KeyringPair } from "@polkadot/keyring/types";
import { ISubmittableResult } from "@polkadot/types/types";

export async function queryBalanceHoldsByAccountId(
    api: ApiPromise,
    accountId: AccountIdInput,
    block?: BlockNumberInput
): Promise<any> {
    const option = block ? await api.at(await api.rpc.chain.getBlockHash(block)) : api;
    const result = await option.query.balances.holds(accountId);
    return result.toJSON();
}

export async function queryBalanceLocksByAccountId(
    api: ApiPromise,
    accountId: AccountIdInput,
    block?: BlockNumberInput
): Promise<AccountLock> {
    const option = block ? await api.at(await api.rpc.chain.getBlockHash(block)) : api;
    const result = await option.query.balances.locks(accountId);
    return result.toJSON() as unknown as AccountLock;
}

export async function queryTotalIssuance(
    api: ApiPromise,
    block?: BlockNumberInput
): Promise<bigint> {
    const option = block ? await api.at(await api.rpc.chain.getBlockHash(block)) : api;
    const result = await option.query.balances.totalIssuance();
    return BigInt(result.toString());
}

export async function queryInactiveIssuance(
    api: ApiPromise,
    block?: BlockNumberInput
): Promise<bigint> {
    const option = block ? await api.at(await api.rpc.chain.getBlockHash(block)) : api;
    const result = await option.query.balances.inactiveIssuance();
    return BigInt(result.toString());
}

export async function transferAll(
    api: ApiPromise,
    keyring: KeyringPair,
    dest: MultiAddressInput,
    keepAlive: Boolean,
    options: TransactionOptions = {}
): Promise<TransactionResult> {
    if (!api?.tx?.balances?.transferAll) {
        throw new SDKError(
            'balances.transferAll method not available',
            'METHOD_NOT_AVAILABLE'
        );
    }

    const config = normalizeTransactionOptions(options);

    const tx = api.tx.balances.transferAll(dest, keepAlive);

    const paymentInfo = config.includePaymentInfo
        ? await calculatePaymentInfo(tx, keyring.address, config.logger)
        : undefined;

    return executeTransaction(
        api,
        tx,
        keyring,
        config,
        paymentInfo
    );
}

export async function transferAllowDeath(
    api: ApiPromise,
    keyring: KeyringPair,
    dest: MultiAddressInput,
    value: BalanceInput,
    options: TransactionOptions = {}
): Promise<TransactionResult> {
    if (!api?.tx?.balances?.transferAllowDeath) {
        throw new SDKError(
            'balances.transferAllowDeath method not available',
            'METHOD_NOT_AVAILABLE'
        );
    }

    const config = normalizeTransactionOptions(options);

    const tx = api.tx.balances.transferAllowDeath(dest, value);

    const paymentInfo = config.includePaymentInfo
        ? await calculatePaymentInfo(tx, keyring.address, config.logger)
        : undefined;

    return executeTransaction(
        api,
        tx,
        keyring,
        config,
        paymentInfo
    );
}

export async function transferKeepAlive(
    api: ApiPromise,
    keyring: KeyringPair,
    dest: MultiAddressInput,
    value: BalanceInput,
    options: TransactionOptions = {}
): Promise<TransactionResult> {
    if (!api?.tx?.balances?.transferKeepAlive) {
        throw new SDKError(
            'balances.transferKeepAlive method not available',
            'METHOD_NOT_AVAILABLE'
        );
    }

    const config = normalizeTransactionOptions(options);

    const tx = api.tx.balances.transferKeepAlive(dest, value);

    const paymentInfo = config.includePaymentInfo
        ? await calculatePaymentInfo(tx, keyring.address, config.logger)
        : undefined;

    return executeTransaction(
        api,
        tx,
        keyring,
        config,
        paymentInfo
    );
}

export interface BatchTransferRecipient {
    /** Destination address */
    dest: MultiAddressInput;
    /** Transfer amount */
    value: BalanceInput;
}

export interface BatchTransferOptions extends TransactionOptions {
    /** Log transfer details for each recipient (default: true) */
    logDetails?: boolean;
}

export interface BatchTransferResult extends TransactionResult {
    /** Number of transfers in the batch */
    transferCount: number;
    /** Individual transfer details */
    transfers: BatchTransferRecipient[];
    /** Failed transfers (if any individual transfer failed) */
    failedTransfers?: {
        index: number;
        recipient: BatchTransferRecipient;
        error: string;
    }[];
}

/**
 * Execute batch transfers using utility.batch with balances.transferKeepAlive
 * This is equivalent to the Python implementation using utility.batch(Balances.transfer_keep_alive)
 *
 * @param api - Polkadot.js API instance
 * @param keyring - Source account keyring pair
 * @param recipients - Array of recipient addresses and amounts
 * @param options - Transaction options
 * @returns Promise<BatchTransferResult>
 */

export async function batchTransferKeepAlive(
    api: ApiPromise,
    keyring: KeyringPair,
    recipients: BatchTransferRecipient[],
    options: BatchTransferOptions = {}
): Promise<BatchTransferResult> {
    // Validate inputs
    if (!api?.tx?.balances?.transferKeepAlive) {
        throw new SDKError(
            'balances.transferKeepAlive method not available',
            'METHOD_NOT_AVAILABLE'
        );
    }

    if (!api?.tx?.utility?.batch) {
        throw new SDKError(
            'utility.batch method not available',
            'METHOD_NOT_AVAILABLE'
        );
    }

    if (!recipients || recipients.length === 0) {
        throw new SDKError(
            'Recipients array cannot be empty',
            'INVALID_PARAMS'
        );
    }

    const config = normalizeTransactionOptions(options);
    const logDetails = options.logDetails ?? true;

    if (logDetails) {
        config.logger.info(`Starting batch transfer to ${recipients.length} accounts`);
    }

    try {
        // Create individual transfer calls
        const transferCalls: SubmittableExtrinsic<'promise', ISubmittableResult>[] = [];

        for (let i = 0; i < recipients.length; i++) {
            const recipient = recipients[i];

            // Validate each recipient
            if (!recipient.dest) {
                throw new SDKError(
                    `Invalid destination address at index ${i}`,
                    'INVALID_PARAMS'
                );
            }

            if (!recipient.value || recipient.value === 0) {
                throw new SDKError(
                    `Invalid transfer amount at index ${i}`,
                    'INVALID_PARAMS'
                );
            }

            // Create transfer call
            const transferCall = api.tx.balances.transferKeepAlive(
                recipient.dest,
                recipient.value
            );

            transferCalls.push(transferCall);

            if (logDetails) {
                config.logger.debug(`Added transfer ${i + 1}/${recipients.length}`, {
                    dest: recipient.dest.toString(),
                    value: recipient.value.toString()
                });
            }
        }

        // Create batch transaction
        const batchTx = api.tx.utility.batch(transferCalls);

        if (logDetails) {
            config.logger.info('Created batch transaction with transfers', {
                transferCount: transferCalls.length,
                batchCallData: batchTx.method.toHex()
            });
        }

        // Calculate payment info if requested
        const paymentInfo = config.includePaymentInfo
            ? await calculatePaymentInfo(batchTx, keyring.address, config.logger)
            : undefined;

        if (paymentInfo && logDetails) {
            config.logger.info('Batch transaction fee estimation', {
                partialFee: paymentInfo.partialFee.toNumber(),
                weight: paymentInfo.weight.toString()
            });
        }

        config.logger.info('Submitting batch transfer transaction...');

        // Execute the batch transaction
        const result = await executeTransaction(
            api,
            batchTx,
            keyring,
            config,
            paymentInfo
        );

        // Process batch-specific results
        const batchResult = processBatchTransferResult(
            result,
            recipients,
            api,
            config.logger,
            logDetails
        );

        if (batchResult.success) {
            config.logger.info('✅ Batch transfer completed successfully', {
                txHash: batchResult.txHash,
                blockHash: batchResult.blockHash,
                transferCount: batchResult.transferCount
            });
        } else {
            config.logger.error('⚠️ Batch transfer failed', {
                txHash: batchResult.txHash,
                error: batchResult.error,
                transferCount: batchResult.transferCount
            });
        }

        return batchResult;

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        config.logger.error('Failed to execute batch transfer', {error: errorMessage});

        if (error instanceof SDKError) {
            throw error;
        }

        throw new SDKError(
            `Batch transfer execution failed: ${errorMessage}`,
            'BATCH_TRANSFER_ERROR',
            error instanceof Error ? error : new Error(errorMessage)
        );
    }
}

export async function burn(
    api: ApiPromise,
    keyring: KeyringPair,
    value: BalanceInput,
    keepAlive: Boolean,
    options: TransactionOptions = {}
): Promise<TransactionResult> {
    if (!api?.tx?.balances?.burn) {
        throw new SDKError(
            'balances.burn method not available',
            'METHOD_NOT_AVAILABLE'
        );
    }

    const config = normalizeTransactionOptions(options);

    const tx = api.tx.balances.burn(value, keepAlive);

    const paymentInfo = config.includePaymentInfo
        ? await calculatePaymentInfo(tx, keyring.address, config.logger)
        : undefined;

    return executeTransaction(
        api,
        tx,
        keyring,
        config,
        paymentInfo
    );
}

function processBatchTransferResult(
    result: TransactionResult,
    recipients: BatchTransferRecipient[],
    api: ApiPromise,
    logger: any,
    logDetails: Boolean
): BatchTransferResult {
    const batchResult: BatchTransferResult = {
        ...result,
        transferCount: recipients.length,
        transfers: recipients
    };

    if (logDetails && result.success) {
        logger.info('Batch transfer events:');

        result.events.forEach((eventRecord, index) => {
            const {event} = eventRecord;

            if (api.events.balances.Transfer.is(event)) {
                try {
                    const humanData = event.data.toHuman();
                    if (Array.isArray(humanData) && humanData.length >= 3) {
                        const [from, to, amount] = humanData;
                        logger.info(`  Transfer ${index + 1}: ${from} -> ${to}: ${amount}`);
                    } else {
                        logger.info(`  Transfer ${index + 1}: ${JSON.stringify(humanData)}`);
                    }
                } catch (error) {
                    logger.debug(`  Transfer ${index + 1}: (data parsing failed)`);
                }
            } else if (api.events.utility.BatchCompleted.is(event)) {
                logger.info('  ✅ Batch completed successfully');
            } else if (api.events.utility.BatchInterrupted.is(event)) {
                try {
                    const humanData = (event as any).data.toHuman();
                    if (Array.isArray(humanData) && humanData.length >= 2) {
                        const [interruptIndex, error] = humanData;
                        logger.warn(`  ⚠️ Batch interrupted at index ${interruptIndex}: ${error}`);
                    } else {
                        logger.warn(`  ⚠️ Batch interrupted: ${JSON.stringify(humanData)}`);
                    }
                } catch (error) {
                    logger.warn('  ⚠️ Batch interrupted (details unavailable)');
                }
            } else if (api.events.system.ExtrinsicSuccess.is(event)) {
                logger.debug('  ✅ Extrinsic executed successfully');
            } else if (api.events.system.ExtrinsicFailed.is(event)) {
                logger.error('  ❌ Extrinsic execution failed');
            }
        });
    }

    // Check for batch-specific failures
    if (result.events.some(({event}) => api.events.utility.BatchInterrupted.is(event))) {
        const failedTransfers: BatchTransferResult['failedTransfers'] = [];

        result.events.forEach(({event}) => {
            if (api.events.utility.BatchInterrupted.is(event)) {
                const [index, error] = event.data;
                const failedIndex = Number(index);

                if (failedIndex < recipients.length) {
                    failedTransfers.push({
                        index: failedIndex,
                        recipient: recipients[failedIndex],
                        error: error.toString()
                    });
                }
            }
        });

        if (failedTransfers.length > 0) {
            batchResult.failedTransfers = failedTransfers;
            logger.warn(`${failedTransfers.length} transfers failed in batch`);
        }
    }

    return batchResult;
}

export function createBatchTransferRecipients(
    addresses: string[],
    amounts: (string | number | bigint)[]
): BatchTransferRecipient[] {
    if (addresses.length !== amounts.length) {
        throw new SDKError(
            'Addresses and amounts arrays must have the same length',
            'INVALID_PARAMS'
        );
    }

    return addresses.map((address, index) => ({
        dest: address,
        value: amounts[index]
    }));
}

export function createUniformBatchTransfers(
    addresses: string[],
    amount: string | number | bigint
): BatchTransferRecipient[] {
    return addresses.map(address => ({
        dest: address,
        value: amount
    }));
}