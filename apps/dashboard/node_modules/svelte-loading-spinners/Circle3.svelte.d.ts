import { SvelteComponentTyped } from "svelte";
declare const __propDef: {
    props: {
        size?: string | number | undefined;
        unit?: string | undefined;
        pause?: boolean | undefined;
        ballTopLeft?: string | undefined;
        ballTopRight?: string | undefined;
        ballBottomLeft?: string | undefined;
        ballBottomRight?: string | undefined;
        duration?: string | undefined;
    };
    events: {
        [evt: string]: CustomEvent<any>;
    };
    slots: {};
};
export declare type Circle3Props = typeof __propDef.props;
export declare type Circle3Events = typeof __propDef.events;
export declare type Circle3Slots = typeof __propDef.slots;
export default class Circle3 extends SvelteComponentTyped<Circle3Props, Circle3Events, Circle3Slots> {
}
export {};
