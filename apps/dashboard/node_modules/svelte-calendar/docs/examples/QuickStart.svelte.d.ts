/** @typedef {typeof __propDef.props}  QuickStartProps */
/** @typedef {typeof __propDef.events}  QuickStartEvents */
/** @typedef {typeof __propDef.slots}  QuickStartSlots */
export default class QuickStart extends SvelteComponentTyped<{}, {
    [evt: string]: CustomEvent<any>;
}, {}> {
}
export type QuickStartProps = typeof __propDef.props;
export type QuickStartEvents = typeof __propDef.events;
export type QuickStartSlots = typeof __propDef.slots;
import { SvelteComponentTyped } from "svelte";
declare const __propDef: {
    props: {};
    events: {
        [evt: string]: CustomEvent<any>;
    };
    slots: {};
};
export {};
