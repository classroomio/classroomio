import type { MeltComponentEvents } from '../../internal/types.js';
import { type MenuEvents } from '../menu/events.js';
export declare const dropdownMenuEvents: {
    menu: readonly ["keydown"];
    trigger: readonly ["pointerdown", "keydown"];
    item: readonly ["pointerdown", "click", "keydown", "pointermove", "pointerleave", "focusin", "focusout"];
    checkboxItem: readonly ["pointerdown", "click", "keydown", "pointermove", "pointerleave", "focusin", "focusout"];
    radioItem: readonly ["pointerdown", "click", "keydown", "pointermove", "pointerleave", "focusin", "focusout"];
    submenu: readonly ["keydown", "pointermove", "focusout"];
    subTrigger: readonly ["click", "keydown", "pointermove", "pointerleave", "focusin", "focusout"];
};
export type DropdownMenuEvents = MenuEvents;
export type DropdownMenuComponentEvents = MeltComponentEvents<DropdownMenuEvents>;
