/** @typedef {typeof __propDef.props}  KeyControlsProps */
/** @typedef {typeof __propDef.events}  KeyControlsEvents */
/** @typedef {typeof __propDef.slots}  KeyControlsSlots */
export default class KeyControls extends SvelteComponentTyped<{
    [x: string]: any;
    limit?: number;
    ctx?: any;
}, {
    [evt: string]: CustomEvent<any>;
}, {
    default: {};
}> {
}
export type KeyControlsProps = typeof __propDef.props;
export type KeyControlsEvents = typeof __propDef.events;
export type KeyControlsSlots = typeof __propDef.slots;
import { SvelteComponentTyped } from "svelte";
declare const __propDef: {
    props: {
        [x: string]: any;
        limit?: number;
        ctx?: any;
    };
    events: {
        [evt: string]: CustomEvent<any>;
    };
    slots: {
        default: {};
    };
};
export {};
