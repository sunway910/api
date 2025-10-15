import { BlockNumberInput, EraInput } from "@cessnetwork/types";

export interface ICessTreasury {
    queryCurrencyReward(block?: BlockNumberInput): Promise<bigint>;
    queryEraReward(block?: BlockNumberInput): Promise<bigint>;
    queryReserveReward(block?: BlockNumberInput): Promise<bigint>;
    queryRoundReward(era: EraInput, block?: BlockNumberInput): Promise<bigint>;
}
