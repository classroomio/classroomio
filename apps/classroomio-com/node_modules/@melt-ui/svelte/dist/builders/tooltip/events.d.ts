import type { GroupedEvents, MeltComponentEvents } from '../../internal/types.js';
export declare const tooltipEvents: {
    trigger: readonly ["pointerdown", "pointerenter", "pointerleave", "focus", "blur", "keydown"];
    content: readonly ["pointerenter", "pointerdown"];
};
export type TooltipEvents = GroupedEvents<typeof tooltipEvents>;
export type TooltipComponentEvents = MeltComponentEvents<TooltipEvents>;
