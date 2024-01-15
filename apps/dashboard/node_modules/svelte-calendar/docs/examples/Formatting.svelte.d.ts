/** @typedef {typeof __propDef.props}  FormattingProps */
/** @typedef {typeof __propDef.events}  FormattingEvents */
/** @typedef {typeof __propDef.slots}  FormattingSlots */
export default class Formatting extends SvelteComponentTyped<{}, {
    [evt: string]: CustomEvent<any>;
}, {}> {
}
export type FormattingProps = typeof __propDef.props;
export type FormattingEvents = typeof __propDef.events;
export type FormattingSlots = typeof __propDef.slots;
import { SvelteComponentTyped } from "svelte";
declare const __propDef: {
    props: {};
    events: {
        [evt: string]: CustomEvent<any>;
    };
    slots: {};
};
export {};
