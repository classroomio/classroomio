/** @typedef {typeof __propDef.props}  NavBarProps */
/** @typedef {typeof __propDef.events}  NavBarEvents */
/** @typedef {typeof __propDef.slots}  NavBarSlots */
export default class NavBar extends SvelteComponentTyped<{}, {
    [evt: string]: CustomEvent<any>;
}, {
    default: {};
}> {
}
export type NavBarProps = typeof __propDef.props;
export type NavBarEvents = typeof __propDef.events;
export type NavBarSlots = typeof __propDef.slots;
import { SvelteComponentTyped } from "svelte";
declare const __propDef: {
    props: {};
    events: {
        [evt: string]: CustomEvent<any>;
    };
    slots: {
        default: {};
    };
};
export {};
