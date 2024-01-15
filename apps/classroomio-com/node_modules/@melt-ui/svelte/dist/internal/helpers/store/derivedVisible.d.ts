/// <reference types="svelte" />
import { type Writable } from 'svelte/store';
type DerivedVisibleObj = {
    open: Writable<boolean>;
    forceVisible: Writable<boolean>;
    activeTrigger: Writable<HTMLElement | null>;
};
/**
 * Helper function to standardize the way we derive a visible state for the
 * popper/floating elements.
 */
export declare function derivedVisible(obj: DerivedVisibleObj): import("svelte/store").Readable<boolean>;
export {};
