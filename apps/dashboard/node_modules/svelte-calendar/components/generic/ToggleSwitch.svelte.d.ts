/** @typedef {typeof __propDef.props}  ToggleSwitchProps */
/** @typedef {typeof __propDef.events}  ToggleSwitchEvents */
/** @typedef {typeof __propDef.slots}  ToggleSwitchSlots */
export default class ToggleSwitch extends SvelteComponentTyped<{
    value?: boolean;
    width?: string;
    height?: string;
}, {
    [evt: string]: CustomEvent<any>;
}, {}> {
}
export type ToggleSwitchProps = typeof __propDef.props;
export type ToggleSwitchEvents = typeof __propDef.events;
export type ToggleSwitchSlots = typeof __propDef.slots;
import { SvelteComponentTyped } from "svelte";
declare const __propDef: {
    props: {
        value?: boolean;
        width?: string;
        height?: string;
    };
    events: {
        [evt: string]: CustomEvent<any>;
    };
    slots: {};
};
export {};
