import { ApiPromise } from "@polkadot/api";
import { KeyringPair } from "@polkadot/keyring/types";

export type Constructor<T = {}> = new (...args: any[]) => T;

export class ChainBase {
    api: ApiPromise | null = null;
    keyring: KeyringPair | null = null;
}
