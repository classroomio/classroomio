/** @typedef {typeof __propDef.props}  InfiniteGridProps */
/** @typedef {typeof __propDef.events}  InfiniteGridEvents */
/** @typedef {typeof __propDef.slots}  InfiniteGridSlots */
export default class InfiniteGrid extends SvelteComponentTyped<{
    get: any;
    index?: number;
    cellCount?: number;
    itemCount?: number;
    vertical?: boolean;
    stiffness?: number;
    damping?: number;
    useCache?: boolean;
    idKey?: any;
    move?: (amount: any) => void;
    triggerUpdate?: () => Promise<void>;
    visibleData?: any;
}, {
    [evt: string]: CustomEvent<any>;
}, {
    default: {
        index: any;
    };
}> {
    get move(): (amount: any) => void;
    get triggerUpdate(): () => Promise<void>;
    get visibleData(): any;
}
export type InfiniteGridProps = typeof __propDef.props;
export type InfiniteGridEvents = typeof __propDef.events;
export type InfiniteGridSlots = typeof __propDef.slots;
import { SvelteComponentTyped } from "svelte";
declare const __propDef: {
    props: {
        get: any;
        index?: number;
        cellCount?: number;
        itemCount?: number;
        vertical?: boolean;
        stiffness?: number;
        damping?: number;
        useCache?: boolean;
        idKey?: any;
        move?: (amount: any) => void;
        triggerUpdate?: () => Promise<void>;
        visibleData?: any;
    };
    events: {
        [evt: string]: CustomEvent<any>;
    };
    slots: {
        default: {
            index: any;
        };
    };
};
export {};
