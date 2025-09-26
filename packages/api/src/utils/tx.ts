import { SignerOptions } from "@polkadot/api-base/types/submittable";
import { DispatchError, EventRecord, Index } from "@polkadot/types/interfaces";
import { ApiPromise } from "@polkadot/api";
import { Logger, LoggerFunction } from "@/utils/logger";
import { SDKError, TransactionError } from "@/utils/error";
import { SubmittableExtrinsic } from "@polkadot/api/types";
import { ISubmittableResult } from "@polkadot/types/types";
import { KeyringPair } from "@polkadot/keyring/types";
import { BN } from "@polkadot/util";
import { sleep } from "@cessnetwork/util";

export function isKeyringReady(keyring: KeyringPair | null): keyring is KeyringPair {
    return keyring !== null && keyring !== undefined;
}

export function isApiReady(api: ApiPromise | null): api is ApiPromise {
    return api !== null && api !== undefined && api.tx !== undefined && api.isConnected;
}

export function isRetryableError(error: any): boolean {
    return error?.code === 'NETWORK_ERROR' ||
        error?.message?.includes('timeout') ||
        error?.message?.includes('connection');
}

export interface PaymentInfo {
    partialFee: BN;
    weight: any;
}

export interface TransactionExecutionOptions {
    /** Wait for finalization instead of inclusion (default: false) */
    waitForFinalization?: boolean;
    /** Timeout in milliseconds (default: 60000) */
    timeout?: number;
    /** Include payment info calculation (default: false) */
    includePaymentInfo?: boolean;
}

export interface TransactionRetryOptions {
    /** Maximum number of retry attempts (default: 3) */
    maxRetries?: number;
    /** Delay between retries in milliseconds (default: 1000) */
    retryDelay?: number;
}

export interface TransactionLoggingOptions {
    /** Logger instance or logger function */
    logger?: Logger | LoggerFunction;
}

export interface TransactionSigningOptions {
    /** Custom nonce to use for the transaction */
    nonce?: number | Index;
    /** Tip to include with the transaction */
    tip?: number | string | BN | undefined;
}

export interface TransactionOptions extends TransactionSigningOptions,
    TransactionExecutionOptions,
    TransactionRetryOptions,
    TransactionLoggingOptions {
}

export interface SubmitTransactionOptions extends TransactionSigningOptions, TransactionExecutionOptions {
    logger: Logger;
}

function isLoggerInstance(obj: any): obj is Logger {
    return obj &&
        typeof obj === 'object' &&
        typeof obj.info === 'function' &&
        typeof obj.warn === 'function' &&
        typeof obj.error === 'function' &&
        typeof obj.debug === 'function';
}

export interface TransactionResult {
    txHash: string;
    blockHash: string;
    blockNumber?: number;
    success: boolean;
    events: EventRecord[];
    paymentInfo?: PaymentInfo;
    error?: {
        code: string;
        message: string;
        section?: string;
        method?: string;
        docs?: string[];
    };
}

export interface NormalizedTransactionOptions {
    waitForFinalization: boolean;
    timeout: number;
    includePaymentInfo: boolean;
    maxRetries: number;
    retryDelay: number;
    nonce?: number | Index;
    tip?: number | string | BN | undefined;
    logger: Logger; // Make logger required after normalization
}

// Helper function to create signing options
function createSigningOptions(nonce?: number | Index, tip?: BN | number | string): Partial<SignerOptions> {
    const options: Partial<SignerOptions> = {};

    if (nonce !== undefined) {
        options.nonce = nonce;
    }

    if (tip !== undefined) {
        options.tip = tip;
    }

    return options;
}

// Default logger instance to avoid repeated creation
const defaultTxLogger = new Logger();

// Helper function to normalize options with defaults
export function normalizeTransactionOptions(options: TransactionOptions): NormalizedTransactionOptions {
    let resolvedLogger: Logger;

    if (!options.logger) {
        resolvedLogger = defaultTxLogger;
    } else if (isLoggerInstance(options.logger)) {
        resolvedLogger = options.logger;
    } else if (typeof options.logger === 'function') {
        resolvedLogger = new Logger(options.logger);
    } else {
        resolvedLogger = defaultTxLogger;
    }

    return {
        waitForFinalization: options.waitForFinalization ?? false,
        timeout: options.timeout ?? 30000,
        includePaymentInfo: options.includePaymentInfo ?? false,
        maxRetries: options.maxRetries ?? 3,
        retryDelay: options.retryDelay ?? 1000,
        nonce: options.nonce,
        tip: options.tip,
        logger: resolvedLogger
    };
}

export function isTransactionSuccess(events: EventRecord[], api: ApiPromise): boolean {
    return events.some(({event}) => api.events.system.ExtrinsicSuccess.is(event));
}

export function isTransactionFailure(events: EventRecord[], api: ApiPromise): boolean {
    return events.some(({event}) => api.events.system.ExtrinsicFailed.is(event));
}

export function createTimeoutPromise(timeout: number): Promise<never> {
    return new Promise((_, reject) => {
        setTimeout(() => {
            reject(new SDKError(
                `Transaction timeout after ${timeout}ms`,
                'TRANSACTION_TIMEOUT'
            ));
        }, timeout);
    });
}

function parseDispatchError(api: ApiPromise, dispatchError: DispatchError) {
    if (dispatchError.isModule) {
        const decoded = api.registry.findMetaError(dispatchError.asModule);
        return {
            code: 'MODULE_ERROR',
            message: `${decoded.section}.${decoded.name}`,
            section: decoded.section,
            method: decoded.name,
            docs: decoded.docs
        };
    }

    return {
        code: 'DISPATCH_ERROR',
        message: dispatchError.toString()
    };
}

export function processTransactionResult(
    api: ApiPromise,
    txHash: string,
    blockHash: string,
    events: EventRecord[],
    dispatchError: DispatchError | undefined,
    logger: Logger
): TransactionResult {
    // Check for dispatch error
    if (dispatchError) {
        const error = parseDispatchError(api, dispatchError);
        logger.error('Transaction dispatch error', error);

        return {
            success: false,
            txHash,
            blockHash,
            events,
            error
        };
    }

    // Check transaction success/failure
    const isSuccess = isTransactionSuccess(events, api);
    const isFailure = isTransactionFailure(events, api);

    if (isFailure || (!isSuccess)) {
        logger.error('Transaction execution failed');
        return {
            success: false,
            txHash,
            blockHash,
            events,
            error: {
                code: 'EXECUTION_FAILED',
                message: 'Transaction execution failed without specific error'
            }
        };
    }

    return {
        success: true,
        txHash,
        blockHash,
        events
    };
}

// Helper function to calculate payment info
export async function calculatePaymentInfo(
    tx: SubmittableExtrinsic<'promise', ISubmittableResult>,
    address: string,
    logger: Logger
): Promise<PaymentInfo | undefined> {
    try {
        const info = await tx.paymentInfo(address);
        logger.info('Transaction payment info calculated', {
            partialFee: info.partialFee.toHuman(),
            weight: info.weight.toString()
        });
        return {
            partialFee: info.partialFee,
            weight: info.weight
        };
    } catch (error) {
        logger.warn('Failed to calculate payment info', error);
        return undefined;
    }
}

export async function submitTransactionWithStatusTracking(
    api: ApiPromise,
    tx: SubmittableExtrinsic<'promise', ISubmittableResult>,
    keyring: KeyringPair,
    options: SubmitTransactionOptions,
    signal: AbortSignal
): Promise<TransactionResult> {
    const {
        waitForFinalization,
        logger,
        nonce,
        tip,
    } = options;

    return new Promise((resolve, reject) => {
        let unsubscribe: (() => void) | undefined;
        let statusReceived = false;

        const cleanup = () => {
            if (unsubscribe) {
                unsubscribe();
                unsubscribe = undefined;
            }
        };

        // Setup abort signal listener
        if (signal) {
            signal.addEventListener('abort', () => {
                cleanup();
                reject(new SDKError('Transaction aborted by timeout', 'TIMEOUT'));
            });
        }

        // Prepare signing options
        const signingOptions = createSigningOptions(nonce, tip);

        // Start transaction submission
        const statusCallback = createStatusCallback(
            api,
            logger,
            waitForFinalization,
            cleanup,
            resolve,
            reject,
            () => {
                statusReceived = true;
            }
        );

        // Use async/await pattern to handle subscription promise correctly
        const handleTransaction = async () => {
            try {
                unsubscribe = await tx.signAndSend(keyring, signingOptions, statusCallback);
            } catch (error) {
                if (!statusReceived) {
                    logger.error('Error signing and sending transaction', error);
                    cleanup();
                    reject(new SDKError(
                        `Failed to sign and send transaction: ${error instanceof Error ? error.message : 'Unknown error'}`,
                        'SIGN_AND_SEND_ERROR',
                        error instanceof Error ? error : new Error('Unknown error')
                    ));
                }
            }
        };

        handleTransaction();
    });
}

// Create submit options without base template
const createSubmitOptions = (
    config: NormalizedTransactionOptions,
): SubmitTransactionOptions => ({
    waitForFinalization: config.waitForFinalization,
    timeout: config.timeout,
    includePaymentInfo: config.includePaymentInfo,
    nonce: config.nonce,
    tip: config.tip,
    logger: config.logger
});

// Optimized retry logic
export async function executeTransaction(
    api: ApiPromise,
    tx: SubmittableExtrinsic<'promise', ISubmittableResult>,
    keyring: KeyringPair,
    config: NormalizedTransactionOptions,
    paymentInfo?: PaymentInfo
): Promise<TransactionResult> {
    const logger = config.logger;
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= config.maxRetries; attempt++) {
        // Create controller and timeout only for this attempt
        const controller = new AbortController();
        let timeoutId: NodeJS.Timeout | undefined;

        try {
            // Set up timeout for this specific attempt
            timeoutId = setTimeout(() => controller.abort(), config.timeout);

            // Create submit options for this attempt
            const submitOptions = createSubmitOptions(config);

            const result = await submitTransactionWithStatusTracking(
                api,
                tx,
                keyring,
                submitOptions,
                controller.signal
            );

            // Add payment info to result if available
            if (paymentInfo) {
                result.paymentInfo = paymentInfo;
            }

            clearTimeout(timeoutId);
            return result;

        } catch (error) {
            if (timeoutId) {
                clearTimeout(timeoutId);
            }

            const isRetryable = attempt < config.maxRetries && isRetryableError(error);

            if (isRetryable) {
                const delayMs = config.retryDelay * attempt;
                logger.warn(`Transaction attempt ${attempt} failed, retrying...`, {
                    error: error instanceof Error ? error.message : 'Unknown error',
                    nextRetryDelay: delayMs
                });
                lastError = error instanceof Error ? error : new Error('Unknown error');
                await sleep(delayMs);
                continue;
            }

            // If not retryable or max attempts reached, throw immediately
            throw error;
        }
    }

    // This should not be reached due to the throw above, but keep for type safety
    throw lastError instanceof SDKError ? lastError : new SDKError(
        `Failed to submit transaction after ${config.maxRetries} attempts: ${lastError?.message || 'Unknown error'}`,
        'SUBMISSION_ERROR',
        lastError
    );
}

// Helper function to create status callback
function createStatusCallback(
    api: ApiPromise,
    logger: Logger,
    waitForFinalization: boolean | undefined,
    cleanup: () => void,
    resolve: (result: TransactionResult) => void,
    reject: (error: Error) => void,
    markStatusReceived: () => void
) {
    return ({status, events, dispatchError, txHash}: ISubmittableResult) => {
        markStatusReceived();

        const txHashHex = txHash.toHex();

        try {
            // Handle ready/broadcast states
            if (status.isReady || status.isBroadcast) {
                return;
            }

            // Handle inclusion
            if (status.isInBlock && !waitForFinalization) {
                const result = processTransactionResult(
                    api, txHashHex, status.asInBlock.toHex(),
                    events, dispatchError, logger
                );
                cleanup();
                resolve(result);
                return;
            }

            // Handle finalization
            if (status.isFinalized) {
                const result = processTransactionResult(
                    api, txHashHex, status.asFinalized.toHex(),
                    events, dispatchError, logger
                );
                cleanup();
                resolve(result);
                return;
            }

            // Handle failure states
            if (status.isDropped || status.isInvalid || status.isUsurped) {
                const error = new TransactionError(
                    `Transaction ${status.type.toLowerCase()}`,
                    txHashHex
                );
                cleanup();
                reject(error);
                return;
            }

        } catch (error) {
            logger.error('Error processing transaction status', error);
            cleanup();
            reject(error instanceof Error ? error : new Error('Unknown processing error'));
        }
    };
}
