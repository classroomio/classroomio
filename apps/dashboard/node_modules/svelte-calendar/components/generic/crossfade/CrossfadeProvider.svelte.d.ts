/** @typedef {typeof __propDef.props}  CrossfadeProviderProps */
/** @typedef {typeof __propDef.events}  CrossfadeProviderEvents */
/** @typedef {typeof __propDef.slots}  CrossfadeProviderSlots */
export default class CrossfadeProvider extends SvelteComponentTyped<{}, {
    [evt: string]: CustomEvent<any>;
}, {
    default: {
        key: any;
        send: any;
        receive: any;
    };
}> {
}
export type CrossfadeProviderProps = typeof __propDef.props;
export type CrossfadeProviderEvents = typeof __propDef.events;
export type CrossfadeProviderSlots = typeof __propDef.slots;
import { SvelteComponentTyped } from "svelte";
declare const __propDef: {
    props: {};
    events: {
        [evt: string]: CustomEvent<any>;
    };
    slots: {
        default: {
            key: any;
            send: any;
            receive: any;
        };
    };
};
export {};
