/** @typedef {typeof __propDef.props}  SwappableProps */
/** @typedef {typeof __propDef.events}  SwappableEvents */
/** @typedef {typeof __propDef.slots}  SwappableSlots */
export default class Swappable extends SvelteComponentTyped<{
    value: any;
    vertical?: boolean;
    opacity?: number;
    delay?: number;
    getId?: (value: any) => any;
    magnitude?: number;
}, {
    [evt: string]: CustomEvent<any>;
}, {
    default: {
        value: any;
    };
}> {
}
export type SwappableProps = typeof __propDef.props;
export type SwappableEvents = typeof __propDef.events;
export type SwappableSlots = typeof __propDef.slots;
import { SvelteComponentTyped } from "svelte";
declare const __propDef: {
    props: {
        value: any;
        vertical?: boolean;
        opacity?: number;
        delay?: number;
        getId?: (value: any) => any;
        magnitude?: number;
    };
    events: {
        [evt: string]: CustomEvent<any>;
    };
    slots: {
        default: {
            value: any;
        };
    };
};
export {};
