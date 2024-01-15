/** @typedef {typeof __propDef.props}  StoreProps */
/** @typedef {typeof __propDef.events}  StoreEvents */
/** @typedef {typeof __propDef.slots}  StoreSlots */
export default class Store extends SvelteComponentTyped<{}, {
    [evt: string]: CustomEvent<any>;
}, {}> {
}
export type StoreProps = typeof __propDef.props;
export type StoreEvents = typeof __propDef.events;
export type StoreSlots = typeof __propDef.slots;
import { SvelteComponentTyped } from "svelte";
declare const __propDef: {
    props: {};
    events: {
        [evt: string]: CustomEvent<any>;
    };
    slots: {};
};
export {};
