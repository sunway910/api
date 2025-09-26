import { BlockNumberInput } from "@cessnetwork/types";

export interface ISession {
    queryValidators(block?: BlockNumberInput): Promise<string[]>;
    queryDisabledValidatorsFromSession(block?: BlockNumberInput): Promise<string[]>;
}
