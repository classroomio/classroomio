import type { GroupedEvents, MeltComponentEvents } from '../../internal/types.js';
export declare const collapsibleEvents: {
    trigger: readonly ["click"];
};
export type CollapsibleEvents = GroupedEvents<typeof collapsibleEvents>;
export type CollapsibleComponentEvents = MeltComponentEvents<CollapsibleEvents>;
