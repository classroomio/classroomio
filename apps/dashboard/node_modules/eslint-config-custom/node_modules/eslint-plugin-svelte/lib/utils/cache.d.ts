export declare function createCache<T>(): {
    get: (key: string) => T | null;
    set: (key: string, value: T) => void;
};
