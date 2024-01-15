/** @typedef {typeof __propDef.props}  CodeProps */
/** @typedef {typeof __propDef.events}  CodeEvents */
/** @typedef {typeof __propDef.slots}  CodeSlots */
export default class Code extends SvelteComponentTyped<{
    pretranslated: any;
    source?: string;
    language?: string;
}, {
    [evt: string]: CustomEvent<any>;
}, {}> {
}
export type CodeProps = typeof __propDef.props;
export type CodeEvents = typeof __propDef.events;
export type CodeSlots = typeof __propDef.slots;
import { SvelteComponentTyped } from "svelte";
declare const __propDef: {
    props: {
        pretranslated: any;
        source?: string;
        language?: string;
    };
    events: {
        [evt: string]: CustomEvent<any>;
    };
    slots: {};
};
export {};
