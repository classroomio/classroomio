/** @typedef {typeof __propDef.props}  FiniteGridProps */
/** @typedef {typeof __propDef.events}  FiniteGridEvents */
/** @typedef {typeof __propDef.slots}  FiniteGridSlots */
export default class FiniteGrid extends SvelteComponentTyped<{
    value: any;
    values: any;
    index?: number;
}, {
    [evt: string]: CustomEvent<any>;
}, {
    default: {
        value: any;
    };
}> {
}
export type FiniteGridProps = typeof __propDef.props;
export type FiniteGridEvents = typeof __propDef.events;
export type FiniteGridSlots = typeof __propDef.slots;
import { SvelteComponentTyped } from "svelte";
declare const __propDef: {
    props: {
        value: any;
        values: any;
        index?: number;
    };
    events: {
        [evt: string]: CustomEvent<any>;
    };
    slots: {
        default: {
            value: any;
        };
    };
};
export {};
