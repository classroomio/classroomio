/** @typedef {typeof __propDef.props}  JsonEditorProps */
/** @typedef {typeof __propDef.events}  JsonEditorEvents */
/** @typedef {typeof __propDef.slots}  JsonEditorSlots */
export default class JsonEditor extends SvelteComponentTyped<{
    set?: (d: any) => void;
    json?: {};
}, {
    [evt: string]: CustomEvent<any>;
}, {}> {
    get set(): (d: any) => void;
}
export type JsonEditorProps = typeof __propDef.props;
export type JsonEditorEvents = typeof __propDef.events;
export type JsonEditorSlots = typeof __propDef.slots;
import { SvelteComponentTyped } from "svelte";
declare const __propDef: {
    props: {
        set?: (d: any) => void;
        json?: {};
    };
    events: {
        [evt: string]: CustomEvent<any>;
    };
    slots: {};
};
export {};
