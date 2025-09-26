import { BlockNumberInput, Endpoints, TeeMasterKeyStatus, TeeWorker, TeeWorkerDetail, TeeWorkerPublicKey, WorkerAddedAt } from "@cessnetwork/types";

export interface ITeeWorker {
    queryMasterPubKey(block?: BlockNumberInput): Promise<TeeMasterKeyStatus | null>;
    queryWorkerByPubKey(puk?: TeeWorkerPublicKey, block?: BlockNumberInput): Promise<TeeWorker | TeeWorkerDetail[] | null>;
    queryEndpoints(puk?: TeeWorkerPublicKey, block?: BlockNumberInput): Promise<string | Endpoints[] | null>;
    queryWorkerStartBlockByPubKey(puk?: TeeWorkerPublicKey, block?: BlockNumberInput): Promise<number | WorkerAddedAt[]>;
    queryWorkerCount(block?: BlockNumberInput): Promise<number>;
}
