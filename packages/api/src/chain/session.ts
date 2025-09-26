import { BlockNumberInput } from "@cessnetwork/types";
import { isApiReady } from "@/utils/tx";
import { SDKError } from "@/utils";
import * as session from '@/pallets/session';
import type { Constructor } from "./types";
import { ChainBase } from "./types";

export function Session<TBase extends Constructor<ChainBase>>(Base: TBase) {
    return class extends Base {
        async queryValidators(block?: BlockNumberInput): Promise<string[]> {
            if (!isApiReady(this.api)) {
                throw new SDKError('API Client is not ready', 'INVALID_API_CLIENT');
            }
            return session.queryValidators(this.api, block);
        }

        async queryDisabledValidatorsFromSession(block?: BlockNumberInput): Promise<string[]> {
            if (!isApiReady(this.api)) {
                throw new SDKError('API Client is not ready', 'INVALID_API_CLIENT');
            }
            return session.queryDisabledValidatorsFromSession(this.api, block);
        }
    }
}