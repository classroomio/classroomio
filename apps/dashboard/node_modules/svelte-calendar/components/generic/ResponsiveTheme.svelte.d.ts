/** @typedef {typeof __propDef.props}  ResponsiveThemeProps */
/** @typedef {typeof __propDef.events}  ResponsiveThemeEvents */
/** @typedef {typeof __propDef.slots}  ResponsiveThemeSlots */
export default class ResponsiveTheme extends SvelteComponentTyped<{}, {
    [evt: string]: CustomEvent<any>;
}, {}> {
}
export type ResponsiveThemeProps = typeof __propDef.props;
export type ResponsiveThemeEvents = typeof __propDef.events;
export type ResponsiveThemeSlots = typeof __propDef.slots;
import { SvelteComponentTyped } from "svelte";
declare const __propDef: {
    props: {};
    events: {
        [evt: string]: CustomEvent<any>;
    };
    slots: {};
};
export {};
