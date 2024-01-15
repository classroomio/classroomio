/** @typedef {typeof __propDef.props}  CrossfadeProps */
/** @typedef {typeof __propDef.events}  CrossfadeEvents */
/** @typedef {typeof __propDef.slots}  CrossfadeSlots */
export default class Crossfade extends SvelteComponentTyped<{
    duration?: (d: any) => number;
    easing?: typeof cubicInOut;
    key?: {};
}, {
    [evt: string]: CustomEvent<any>;
}, {
    default: {
        key: {};
        send: (node: Element, params: import("svelte/transition").CrossfadeParams & {
            key: any;
        }) => () => import("svelte/transition").TransitionConfig;
        receive: (node: Element, params: import("svelte/transition").CrossfadeParams & {
            key: any;
        }) => () => import("svelte/transition").TransitionConfig;
    };
}> {
}
export type CrossfadeProps = typeof __propDef.props;
export type CrossfadeEvents = typeof __propDef.events;
export type CrossfadeSlots = typeof __propDef.slots;
import { cubicInOut } from "svelte/types/runtime/easing";
import { SvelteComponentTyped } from "svelte";
declare const __propDef: {
    props: {
        duration?: (d: any) => number;
        easing?: typeof cubicInOut;
        key?: {};
    };
    events: {
        [evt: string]: CustomEvent<any>;
    };
    slots: {
        default: {
            key: {};
            send: (node: Element, params: import("svelte/transition").CrossfadeParams & {
                key: any;
            }) => () => import("svelte/transition").TransitionConfig;
            receive: (node: Element, params: import("svelte/transition").CrossfadeParams & {
                key: any;
            }) => () => import("svelte/transition").TransitionConfig;
        };
    };
};
export {};
