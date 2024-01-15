/** @typedef {typeof __propDef.props}  CustomTriggerProps */
/** @typedef {typeof __propDef.events}  CustomTriggerEvents */
/** @typedef {typeof __propDef.slots}  CustomTriggerSlots */
export default class CustomTrigger extends SvelteComponentTyped<{}, {
    [evt: string]: CustomEvent<any>;
}, {}> {
}
export type CustomTriggerProps = typeof __propDef.props;
export type CustomTriggerEvents = typeof __propDef.events;
export type CustomTriggerSlots = typeof __propDef.slots;
import { SvelteComponentTyped } from "svelte";
declare const __propDef: {
    props: {};
    events: {
        [evt: string]: CustomEvent<any>;
    };
    slots: {};
};
export {};
