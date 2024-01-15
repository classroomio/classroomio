/** @typedef {typeof __propDef.props}  SprungProps */
/** @typedef {typeof __propDef.events}  SprungEvents */
/** @typedef {typeof __propDef.slots}  SprungSlots */
export default class Sprung extends SvelteComponentTyped<{
    value: any;
}, {
    [evt: string]: CustomEvent<any>;
}, {
    default: {};
}> {
}
export type SprungProps = typeof __propDef.props;
export type SprungEvents = typeof __propDef.events;
export type SprungSlots = typeof __propDef.slots;
import { SvelteComponentTyped } from "svelte";
declare const __propDef: {
    props: {
        value: any;
    };
    events: {
        [evt: string]: CustomEvent<any>;
    };
    slots: {
        default: {};
    };
};
export {};
