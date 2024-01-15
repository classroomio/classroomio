/** @typedef {typeof __propDef.props}  CodeExampleProps */
/** @typedef {typeof __propDef.events}  CodeExampleEvents */
/** @typedef {typeof __propDef.slots}  CodeExampleSlots */
export default class CodeExample extends SvelteComponentTyped<{
    style?: string;
    codeLabel?: string;
    exampleLabel?: string;
    gridTemplate?: string;
}, {
    [evt: string]: CustomEvent<any>;
}, {
    code: {};
    default: {};
}> {
}
export type CodeExampleProps = typeof __propDef.props;
export type CodeExampleEvents = typeof __propDef.events;
export type CodeExampleSlots = typeof __propDef.slots;
import { SvelteComponentTyped } from "svelte";
declare const __propDef: {
    props: {
        style?: string;
        codeLabel?: string;
        exampleLabel?: string;
        gridTemplate?: string;
    };
    events: {
        [evt: string]: CustomEvent<any>;
    };
    slots: {
        code: {};
        default: {};
    };
};
export {};
