/** @typedef {typeof __propDef.props}  ScrollableProps */
/** @typedef {typeof __propDef.events}  ScrollableEvents */
/** @typedef {typeof __propDef.slots}  ScrollableSlots */
export default class Scrollable extends SvelteComponentTyped<{
    y?: number;
}, {
    [evt: string]: CustomEvent<any>;
}, {
    default: {};
}> {
}
export type ScrollableProps = typeof __propDef.props;
export type ScrollableEvents = typeof __propDef.events;
export type ScrollableSlots = typeof __propDef.slots;
import { SvelteComponentTyped } from "svelte";
declare const __propDef: {
    props: {
        y?: number;
    };
    events: {
        [evt: string]: CustomEvent<any>;
    };
    slots: {
        default: {};
    };
};
export {};
