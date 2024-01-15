/// <reference types="svelte" />
export declare function debounceable<T>(initialValue: T, wait?: number): {
    debouncedSet: (value: T) => void;
    debouncedUpdate: (fn: (value: T) => T) => void;
    set: (value: T) => void;
    update: (fn: (value: T) => T) => void;
    subscribe(this: void, run: import("svelte/store").Subscriber<{
        value: T;
        debounced: T;
    }>, invalidate?: import("svelte/store").Invalidator<{
        value: T;
        debounced: T;
    }> | undefined): import("svelte/store").Unsubscriber;
};
