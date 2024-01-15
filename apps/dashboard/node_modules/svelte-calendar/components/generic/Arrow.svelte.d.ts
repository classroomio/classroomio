/** @typedef {typeof __propDef.props}  ArrowProps */
/** @typedef {typeof __propDef.events}  ArrowEvents */
/** @typedef {typeof __propDef.slots}  ArrowSlots */
export default class Arrow extends SvelteComponentTyped<{
    dir?: string;
}, {
    [evt: string]: CustomEvent<any>;
}, {}> {
}
export type ArrowProps = typeof __propDef.props;
export type ArrowEvents = typeof __propDef.events;
export type ArrowSlots = typeof __propDef.slots;
import { SvelteComponentTyped } from "svelte";
declare const __propDef: {
    props: {
        dir?: string;
    };
    events: {
        [evt: string]: CustomEvent<any>;
    };
    slots: {};
};
export {};
