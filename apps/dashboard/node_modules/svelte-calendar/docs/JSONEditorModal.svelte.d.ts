/** @typedef {typeof __propDef.props}  JsonEditorModalProps */
/** @typedef {typeof __propDef.events}  JsonEditorModalEvents */
/** @typedef {typeof __propDef.slots}  JsonEditorModalSlots */
export default class JsonEditorModal extends SvelteComponentTyped<{}, {
    keydown: KeyboardEvent;
} & {
    [evt: string]: CustomEvent<any>;
}, {}> {
}
export type JsonEditorModalProps = typeof __propDef.props;
export type JsonEditorModalEvents = typeof __propDef.events;
export type JsonEditorModalSlots = typeof __propDef.slots;
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
