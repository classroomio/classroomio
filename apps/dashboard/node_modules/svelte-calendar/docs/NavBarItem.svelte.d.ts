/** @typedef {typeof __propDef.props}  NavBarItemProps */
/** @typedef {typeof __propDef.events}  NavBarItemEvents */
/** @typedef {typeof __propDef.slots}  NavBarItemSlots */
export default class NavBarItem extends SvelteComponentTyped<{
    href?: string;
    isActive?: (path: any) => boolean;
}, {
    click: CustomEvent<any>;
} & {
    [evt: string]: CustomEvent<any>;
}, {
    default: {};
}> {
}
export type NavBarItemProps = typeof __propDef.props;
export type NavBarItemEvents = typeof __propDef.events;
export type NavBarItemSlots = typeof __propDef.slots;
import { SvelteComponentTyped } from "svelte";
declare const __propDef: {
    props: {
        href?: string;
        isActive?: (path: any) => boolean;
    };
    events: {
        click: CustomEvent<any>;
    } & {
        [evt: string]: CustomEvent<any>;
    };
    slots: {
        default: {};
    };
};
export {};
