/** @typedef {typeof __propDef.props}  DocPageProps */
/** @typedef {typeof __propDef.events}  DocPageEvents */
/** @typedef {typeof __propDef.slots}  DocPageSlots */
export default class DocPage extends SvelteComponentTyped<{
    padContents?: boolean;
}, {
    [evt: string]: CustomEvent<any>;
}, {
    title: {};
    default: {};
}> {
}
export type DocPageProps = typeof __propDef.props;
export type DocPageEvents = typeof __propDef.events;
export type DocPageSlots = typeof __propDef.slots;
import { SvelteComponentTyped } from "svelte";
declare const __propDef: {
    props: {
        padContents?: boolean;
    };
    events: {
        [evt: string]: CustomEvent<any>;
    };
    slots: {
        title: {};
        default: {};
    };
};
export {};
