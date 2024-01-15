/** @typedef {typeof __propDef.props}  DayPickerProps */
/** @typedef {typeof __propDef.events}  DayPickerEvents */
/** @typedef {typeof __propDef.slots}  DayPickerSlots */
export default class DayPicker extends SvelteComponentTyped<{}, {
    keydown: KeyboardEvent;
} & {
    [evt: string]: CustomEvent<any>;
}, {}> {
}
export type DayPickerProps = typeof __propDef.props;
export type DayPickerEvents = typeof __propDef.events;
export type DayPickerSlots = typeof __propDef.slots;
import { SvelteComponentTyped } from "svelte";
declare const __propDef: {
    props: {};
    events: {
        keydown: KeyboardEvent;
    } & {
        [evt: string]: CustomEvent<any>;
    };
    slots: {};
};
export {};
