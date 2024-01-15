/** @typedef {typeof __propDef.props}  ThemeProviderProps */
/** @typedef {typeof __propDef.events}  ThemeProviderEvents */
/** @typedef {typeof __propDef.slots}  ThemeProviderSlots */
export default class ThemeProvider extends SvelteComponentTyped<{
    key?: any;
}, {
    [evt: string]: CustomEvent<any>;
}, {}> {
}
export type ThemeProviderProps = typeof __propDef.props;
export type ThemeProviderEvents = typeof __propDef.events;
export type ThemeProviderSlots = typeof __propDef.slots;
import { SvelteComponentTyped } from "svelte";
declare const __propDef: {
    props: {
        key?: any;
    };
    events: {
        [evt: string]: CustomEvent<any>;
    };
    slots: {};
};
export {};
