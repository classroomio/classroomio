import type { GroupedEvents, MeltComponentEvents } from '../../internal/types.js';
export declare const menubarEvents: {
    menu: readonly ["keydown"];
    trigger: readonly ["click", "keydown", "pointerenter"];
    item: readonly ["pointerdown", "click", "keydown", "pointermove", "pointerleave", "focusin", "focusout"];
    checkboxItem: readonly ["pointerdown", "click", "keydown", "pointermove", "pointerleave", "focusin", "focusout"];
    radioItem: readonly ["pointerdown", "click", "keydown", "pointermove", "pointerleave", "focusin", "focusout"];
    submenu: readonly ["keydown", "pointermove", "focusout"];
    subTrigger: readonly ["click", "keydown", "pointermove", "pointerleave", "focusin", "focusout"];
};
export type MenubarEvents = GroupedEvents<typeof menubarEvents>;
export type MenubarComponentEvents = MeltComponentEvents<MenubarEvents>;
