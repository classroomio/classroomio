declare namespace _default {
    export { get };
}
export default _default;
declare function get({ selected, start, end, startOfWeekIndex, shouldEnlargeDay }: {
    selected: any;
    start: any;
    end: any;
    startOfWeekIndex?: number;
    shouldEnlargeDay?: boolean;
}): {
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
