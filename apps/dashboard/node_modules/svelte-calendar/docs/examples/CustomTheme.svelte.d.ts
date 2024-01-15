/** @typedef {typeof __propDef.props}  CustomThemeProps */
/** @typedef {typeof __propDef.events}  CustomThemeEvents */
/** @typedef {typeof __propDef.slots}  CustomThemeSlots */
export default class CustomTheme extends SvelteComponentTyped<{}, {
    [evt: string]: CustomEvent<any>;
}, {}> {
}
export type CustomThemeProps = typeof __propDef.props;
export type CustomThemeEvents = typeof __propDef.events;
export type CustomThemeSlots = typeof __propDef.slots;
import { SvelteComponentTyped } from "svelte";
declare const __propDef: {
    props: {};
    events: {
        [evt: string]: CustomEvent<any>;
    };
    slots: {};
};
export {};
