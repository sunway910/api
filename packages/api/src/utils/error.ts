import { DispatchError } from '@polkadot/types/interfaces';

export class SDKError extends Error {
    constructor(
        message: string,
        public readonly code: string,
        public readonly details?: unknown
    ) {
        super(message);
        this.name = 'SDKError';
    }
}

export class TransactionError extends SDKError {
    constructor(
        message: string,
        public readonly txHash?: string,
        public readonly dispatchError?: DispatchError
    ) {
        super(message, 'TRANSACTION_ERROR', { txHash, dispatchError });
        this.name = 'TransactionError';
    }
}


export enum ErrorType {
    ERR_Failed = "failed",
    ERR_Timeout = "request timeout",
    ERR_Empty = "empty result",
    ERR_PriorityIsTooLow = "Priority is too low"
}