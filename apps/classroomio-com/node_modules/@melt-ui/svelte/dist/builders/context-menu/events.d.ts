import type { GroupedEvents, MeltComponentEvents } from '../../internal/types.js';
export declare const contextMenuEvents: {
    menu: readonly ["keydown"];
    trigger: readonly ["contextmenu", "pointerdown", "pointermove", "pointercancel", "pointerup"];
    item: readonly ["pointerdown", "click", "keydown", "pointermove", "pointerleave", "focusin", "focusout"];
    checkboxItem: readonly ["pointerdown", "click", "keydown", "pointermove", "pointerleave", "focusin", "focusout"];
    radioItem: readonly ["pointerdown", "click", "keydown", "pointermove", "pointerleave", "focusin", "focusout"];
    submenu: readonly ["keydown", "pointermove", "focusout"];
    subTrigger: readonly ["click", "keydown", "pointermove", "pointerleave", "focusin", "focusout"];
};
export type ContextMenuEvents = GroupedEvents<typeof contextMenuEvents>;
export type ContextMenuComponentEvents = MeltComponentEvents<ContextMenuEvents>;
