/** @typedef {typeof __propDef.props}  SvgThingProps */
/** @typedef {typeof __propDef.events}  SvgThingEvents */
/** @typedef {typeof __propDef.slots}  SvgThingSlots */
export default class SvgThing extends SvelteComponentTyped<{}, {
    [evt: string]: CustomEvent<any>;
}, {}> {
}
export type SvgThingProps = typeof __propDef.props;
export type SvgThingEvents = typeof __propDef.events;
export type SvgThingSlots = typeof __propDef.slots;
import { SvelteComponentTyped } from "svelte";
declare const __propDef: {
    props: {};
    events: {
        [evt: string]: CustomEvent<any>;
    };
    slots: {};
};
export {};
