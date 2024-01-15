/** @typedef {typeof __propDef.props}  ThemeProps */
/** @typedef {typeof __propDef.events}  ThemeEvents */
/** @typedef {typeof __propDef.slots}  ThemeSlots */
export default class Theme extends SvelteComponentTyped<{
    appliedTheme: any;
    theme?: {};
    prefix?: string;
    defaultTheme?: {
        calendar: {
            width: string;
            maxWidth: string;
            legend: {
                height: string;
            };
            shadow: string;
            colors: {
                text: {
                    primary: string;
                    highlight: string;
                };
                background: {
                    primary: string;
                    highlight: string;
                    hover: string;
                };
                border: string;
            };
            font: {
                regular: string;
                large: string;
            };
            grid: {
                disabledOpacity: string;
                outsiderOpacity: string;
            };
        };
    };
}, {
    [evt: string]: CustomEvent<any>;
}, {
    default: {
        appliedTheme: any;
        style: string;
    };
}> {
}
export type ThemeProps = typeof __propDef.props;
export type ThemeEvents = typeof __propDef.events;
export type ThemeSlots = typeof __propDef.slots;
import { SvelteComponentTyped } from "svelte";
declare const __propDef: {
    props: {
        appliedTheme: any;
        theme?: {};
        prefix?: string;
        defaultTheme?: {
            calendar: {
                width: string;
                maxWidth: string;
                legend: {
                    height: string;
                };
                shadow: string;
                colors: {
                    text: {
                        primary: string;
                        highlight: string;
                    };
                    background: {
                        primary: string;
                        highlight: string;
                        hover: string;
                    };
                    border: string;
                };
                font: {
                    regular: string;
                    large: string;
                };
                grid: {
                    disabledOpacity: string;
                    outsiderOpacity: string;
                };
            };
        };
    };
    events: {
        [evt: string]: CustomEvent<any>;
    };
    slots: {
        default: {
            appliedTheme: any;
            style: string;
        };
    };
};
export {};
