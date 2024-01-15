export function get(): {
    subscribe: (this: void, run: import("svelte/store").Subscriber<{
        json: any;
        codeChildren: any[];
        mappings: any[];
        highlighted: any;
        focusTarget: any;
        newValue: any;
        editing: any;
    }>, invalidate?: (value?: {
        json: any;
        codeChildren: any[];
        mappings: any[];
        highlighted: any;
        focusTarget: any;
        newValue: any;
        editing: any;
    }) => void) => import("svelte/store").Unsubscriber;
    updateMappings(): any;
    json(json: any): any;
    trackFocus(evt: any): void;
    registerChildren(codeChildren: any): any;
    openEditor(evt: any): void;
    set(path: any, val: any): void;
    commit(value: any): void;
    cancelEdit(): void;
    moveFocus(dir: any): void;
};
