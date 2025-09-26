import { isApiReady } from "@/utils/tx";
import { SDKError } from "@/utils";
import * as cessTreasury from '@/pallets/cess_treasury';
import type { Constructor } from "./types";
import { ChainBase } from "./types";
import { BlockNumberInput } from '@cessnetwork/types';

export function CessTreasury<TBase extends Constructor<ChainBase>>(Base: TBase) {
    return class extends Base {
        async queryCurrencyReward(block?: BlockNumberInput): Promise<bigint> {
            if (!isApiReady(this.api)) {
                throw new SDKError('API Client is not ready', 'INVALID_API_CLIENT');
            }
            return cessTreasury.queryCurrencyReward(this.api, block);
        }

        async queryEraReward(block?: BlockNumberInput): Promise<bigint> {
            if (!isApiReady(this.api)) {
                throw new SDKError('API Client is not ready', 'INVALID_API_CLIENT');
            }
            return cessTreasury.queryEraReward(this.api, block);
        }

        async queryReserveReward(block?: BlockNumberInput): Promise<bigint> {
            if (!isApiReady(this.api)) {
                throw new SDKError('API Client is not ready', 'INVALID_API_CLIENT');
            }
            return cessTreasury.queryReserveReward(this.api, block);
        }

        async queryRoundReward(era: number, block?: BlockNumberInput): Promise<bigint> {
            if (!isApiReady(this.api)) {
                throw new SDKError('API Client is not ready', 'INVALID_API_CLIENT');
            }
            return cessTreasury.queryRoundReward(this.api, era, block);
        }
    }
}
