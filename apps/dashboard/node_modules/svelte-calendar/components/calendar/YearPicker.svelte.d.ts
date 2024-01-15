/** @typedef {typeof __propDef.props}  YearPickerProps */
/** @typedef {typeof __propDef.events}  YearPickerEvents */
/** @typedef {typeof __propDef.slots}  YearPickerSlots */
export default class YearPicker extends SvelteComponentTyped<{
    rowCount?: number;
    colCount?: number;
}, {
    [evt: string]: CustomEvent<any>;
}, {}> {
}
export type YearPickerProps = typeof __propDef.props;
export type YearPickerEvents = typeof __propDef.events;
export type YearPickerSlots = typeof __propDef.slots;
import { SvelteComponentTyped } from "svelte";
declare const __propDef: {
    props: {
        rowCount?: number;
        colCount?: number;
    };
    events: {
        [evt: string]: CustomEvent<any>;
    };
    slots: {};
};
export {};
