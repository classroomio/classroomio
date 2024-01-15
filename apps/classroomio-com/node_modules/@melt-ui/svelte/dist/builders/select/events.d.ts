import type { GroupedEvents, MeltComponentEvents } from '../../internal/types.js';
export declare const selectEvents: {
    menu: readonly ["keydown"];
    trigger: readonly ["click", "keydown"];
    label: readonly ["click"];
    option: readonly ["click", "keydown", "pointermove", "pointerleave", "focusin", "focusout"];
};
export type SelectEvents = GroupedEvents<typeof selectEvents>;
export type SelectComponentEvents = MeltComponentEvents<SelectEvents>;
