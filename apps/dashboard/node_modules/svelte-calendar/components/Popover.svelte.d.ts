/** @typedef {typeof __propDef.props}  PopoverProps */
/** @typedef {typeof __propDef.events}  PopoverEvents */
/** @typedef {typeof __propDef.slots}  PopoverSlots */
export default class Popover extends SvelteComponentTyped<{
    close?: () => void;
    isOpen?: boolean;
    style?: string;
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
    contents: {
        key: {};
        send: (node: Element, params: import("svelte/transition").CrossfadeParams & {
            key: any;
        }) => () => import("svelte/transition").TransitionConfig;
        receive: (node: Element, params: import("svelte/transition").CrossfadeParams & {
            key: any;
        }) => () => import("svelte/transition").TransitionConfig;
    };
}> {
    get close(): () => void;
}
export type PopoverProps = typeof __propDef.props;
export type PopoverEvents = typeof __propDef.events;
export type PopoverSlots = typeof __propDef.slots;
import { SvelteComponentTyped } from "svelte";
declare const __propDef: {
    props: {
        close?: () => void;
        isOpen?: boolean;
        style?: string;
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
        contents: {
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
