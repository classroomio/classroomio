import type { GroupedEvents, MeltComponentEvents } from '../../internal/types.js';
export declare const toastEvents: {
    content: readonly ["pointerenter", "pointerleave", "focusout"];
    close: readonly ["click", "keydown"];
};
export type ToastEvents = GroupedEvents<typeof toastEvents>;
export type ToastComponentEvents = MeltComponentEvents<ToastEvents>;
