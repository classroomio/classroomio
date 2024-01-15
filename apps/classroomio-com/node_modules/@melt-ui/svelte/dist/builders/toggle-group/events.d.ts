import type { GroupedEvents, MeltComponentEvents } from '../../internal/types.js';
export declare const toggleGroupEvents: {
    item: readonly ["click", "keydown"];
};
export type ToggleGroupEvents = GroupedEvents<typeof toggleGroupEvents>;
export type ToggleGroupComponentEvents = MeltComponentEvents<ToggleGroupEvents>;
