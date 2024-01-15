/** @typedef {typeof __propDef.props}  StartAndEndProps */
/** @typedef {typeof __propDef.events}  StartAndEndEvents */
/** @typedef {typeof __propDef.slots}  StartAndEndSlots */
export default class StartAndEnd extends SvelteComponentTyped<{}, {
    [evt: string]: CustomEvent<any>;
}, {}> {
}
export type StartAndEndProps = typeof __propDef.props;
export type StartAndEndEvents = typeof __propDef.events;
export type StartAndEndSlots = typeof __propDef.slots;
import { SvelteComponentTyped } from "svelte";
declare const __propDef: {
    props: {};
    events: {
        [evt: string]: CustomEvent<any>;
    };
    slots: {};
};
export {};
