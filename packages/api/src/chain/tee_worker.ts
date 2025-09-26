import {
    BlockNumberInput,
    Endpoints,
    TeeMasterKeyStatus,
    TeeWorker,
    TeeWorkerDetail, TeeWorkerPublicKey,
    WorkerAddedAt
} from "@cessnetwork/types";
import { isApiReady } from "@/utils/tx";
import { SDKError } from "@/utils";
import * as teeWorker from '@/pallets/tee';
import type { Constructor } from "./types";
import { ChainBase } from "./types";

export function Tee_Worker<TBase extends Constructor<ChainBase>>(Base: TBase) {
    return class extends Base {
        async queryMasterPubKey(block?: BlockNumberInput): Promise<TeeMasterKeyStatus | null> {
            if (!isApiReady(this.api)) {
                throw new SDKError('API Client is not ready', 'INVALID_API_CLIENT');
            }
            return teeWorker.queryMasterPubKey(this.api, block);
        }

        async queryWorkerByPubKey(puk?: TeeWorkerPublicKey, block?: BlockNumberInput): Promise<TeeWorker | TeeWorkerDetail[] | null> {
            if (!isApiReady(this.api)) {
                throw new SDKError('API Client is not ready', 'INVALID_API_CLIENT');
            }
            return teeWorker.queryWorkerByPubKey(this.api, puk, block);
        }

        async queryEndpoints(puk?: TeeWorkerPublicKey, block?: BlockNumberInput): Promise<string | Endpoints[] | null> {
            if (!isApiReady(this.api)) {
                throw new SDKError('API Client is not ready', 'INVALID_API_CLIENT');
            }
            return teeWorker.queryEndpointByPubKey(this.api, puk, block);
        }

        async queryWorkerStartBlockByPubKey(puk?: TeeWorkerPublicKey, block?: BlockNumberInput): Promise<number | WorkerAddedAt[]> {
            if (!isApiReady(this.api)) {
                throw new SDKError('API Client is not ready', 'INVALID_API_CLIENT');
            }
            return teeWorker.queryWorkerStartBlockByPubKey(this.api, puk, block);
        }

        async queryWorkerCount(block?: BlockNumberInput): Promise<number> {
            if (!isApiReady(this.api)) {
                throw new SDKError('API Client is not ready', 'INVALID_API_CLIENT');
            }
            return teeWorker.queryWorkerCount(this.api, block);
        }
    }
}