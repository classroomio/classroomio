/** @typedef {typeof __propDef.props}  InlineCalendarProps */
/** @typedef {typeof __propDef.events}  InlineCalendarEvents */
/** @typedef {typeof __propDef.slots}  InlineCalendarSlots */
export default class InlineCalendar extends SvelteComponentTyped<{
    selected?: Date;
    start?: Date;
    end?: Date;
    startOfWeekIndex?: number;
    theme?: {};
    defaultTheme?: any;
    format?: string;
    formatted?: string;
    store?: {
        set: (this: void, value: {
            open: boolean;
            hasChosen: boolean;
            selected: any;
            start: Date;
            end: Date;
            shouldEnlargeDay: boolean;
            enlargeDay: boolean;
            year: any;
            month: any;
            day: any;
            activeView: string;
            activeViewDirection: number;
            startOfWeekIndex: number;
        }) => void;
        subscribe: (this: void, run: import("svelte/store").Subscriber<{
            open: boolean;
            hasChosen: boolean;
            selected: any;
            start: Date;
            end: Date;
            shouldEnlargeDay: boolean;
            enlargeDay: boolean;
            year: any;
            month: any;
            day: any;
            activeView: string;
            activeViewDirection: number;
            startOfWeekIndex: number;
        }>, invalidate?: (value?: {
            open: boolean;
            hasChosen: boolean;
            selected: any;
            start: Date;
            end: Date;
            shouldEnlargeDay: boolean;
            enlargeDay: boolean;
            year: any;
            month: any;
            day: any;
            activeView: string;
            activeViewDirection: number;
            startOfWeekIndex: number;
        }) => void) => import("svelte/store").Unsubscriber;
        getState(): {
            open: boolean;
            hasChosen: boolean;
            selected: any;
            start: Date;
            end: Date;
            shouldEnlargeDay: boolean;
            enlargeDay: boolean;
            year: any;
            month: any;
            day: any;
            activeView: string;
            activeViewDirection: number;
            startOfWeekIndex: number;
        };
        enlargeDay(enlargeDay?: boolean): void;
        getSelectableVector(date: any): 0 | 1 | -1;
        isSelectable(date: any, clamping?: any[]): any;
        clampValue(day: any, clampable: any): any;
        add(amount: any, unit: any, clampable?: any[]): void;
        setActiveView(newActiveView: any): void;
        setYear(year: any): void;
        setMonth(month: any): void;
        setDay(day: any): void;
        close(extraState: any): void;
        selectDay(): void;
        getCalendarPage(month: any, year: any): {
            date: any;
            outsider: boolean;
        }[];
    };
}, {
    [evt: string]: CustomEvent<any>;
}, {}> {
}
export type InlineCalendarProps = typeof __propDef.props;
export type InlineCalendarEvents = typeof __propDef.events;
export type InlineCalendarSlots = typeof __propDef.slots;
import { SvelteComponentTyped } from "svelte";
declare const __propDef: {
    props: {
        selected?: Date;
        start?: Date;
        end?: Date;
        startOfWeekIndex?: number;
        theme?: {};
        defaultTheme?: any;
        format?: string;
        formatted?: string;
        store?: {
            set: (this: void, value: {
                open: boolean;
                hasChosen: boolean;
                selected: any;
                start: Date;
                end: Date;
                shouldEnlargeDay: boolean;
                enlargeDay: boolean;
                year: any;
                month: any;
                day: any;
                activeView: string;
                activeViewDirection: number;
                startOfWeekIndex: number;
            }) => void;
            subscribe: (this: void, run: import("svelte/store").Subscriber<{
                open: boolean;
                hasChosen: boolean;
                selected: any;
                start: Date;
                end: Date;
                shouldEnlargeDay: boolean;
                enlargeDay: boolean;
                year: any;
                month: any;
                day: any;
                activeView: string;
                activeViewDirection: number;
                startOfWeekIndex: number;
            }>, invalidate?: (value?: {
                open: boolean;
                hasChosen: boolean;
                selected: any;
                start: Date;
                end: Date;
                shouldEnlargeDay: boolean;
                enlargeDay: boolean;
                year: any;
                month: any;
                day: any;
                activeView: string;
                activeViewDirection: number;
                startOfWeekIndex: number;
            }) => void) => import("svelte/store").Unsubscriber;
            getState(): {
                open: boolean;
                hasChosen: boolean;
                selected: any;
                start: Date;
                end: Date;
                shouldEnlargeDay: boolean;
                enlargeDay: boolean;
                year: any;
                month: any;
                day: any;
                activeView: string;
                activeViewDirection: number;
                startOfWeekIndex: number;
            };
            enlargeDay(enlargeDay?: boolean): void;
            getSelectableVector(date: any): 0 | 1 | -1;
            isSelectable(date: any, clamping?: any[]): any;
            clampValue(day: any, clampable: any): any;
            add(amount: any, unit: any, clampable?: any[]): void;
            setActiveView(newActiveView: any): void;
            setYear(year: any): void;
            setMonth(month: any): void;
            setDay(day: any): void;
            close(extraState: any): void;
            selectDay(): void;
            getCalendarPage(month: any, year: any): {
                date: any;
                outsider: boolean;
            }[];
        };
    };
    events: {
        [evt: string]: CustomEvent<any>;
    };
    slots: {};
};
export {};
