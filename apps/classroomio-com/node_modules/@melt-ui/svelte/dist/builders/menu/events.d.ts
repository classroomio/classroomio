import type { GroupedEvents } from '../../internal/types.js';
export declare const menuEvents: {
    menu: readonly ["keydown"];
    trigger: readonly ["pointerdown", "keydown"];
    item: readonly ["pointerdown", "click", "keydown", "pointermove", "pointerleave", "focusin", "focusout"];
    checkboxItem: readonly ["pointerdown", "click", "keydown", "pointermove", "pointerleave", "focusin", "focusout"];
    radioItem: readonly ["pointerdown", "click", "keydown", "pointermove", "pointerleave", "focusin", "focusout"];
    submenu: readonly ["keydown", "pointermove", "focusout"];
    subTrigger: readonly ["click", "keydown", "pointermove", "pointerleave", "focusin", "focusout"];
};
export type MenuEvents = GroupedEvents<typeof menuEvents>;
