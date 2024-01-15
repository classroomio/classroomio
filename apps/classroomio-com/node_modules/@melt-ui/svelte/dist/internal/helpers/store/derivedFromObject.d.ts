import { type Readable } from 'svelte/store';
type StoresObj = Record<string, Readable<unknown>>;
type StoresObjValues<S extends StoresObj> = {
    [K in keyof S as `$${K extends string ? K : never}`]: S[K] extends Readable<infer U> ? U : never;
};
export declare function derivedFromObject<S extends StoresObj, Callback extends (values: StoresObjValues<S>) => unknown>(stores: S, fn: Callback): Readable<ReturnType<Callback>>;
export {};
