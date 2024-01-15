import type { GroupedEvents, MeltComponentEvents } from '../../internal/types.js';
export declare const toggleEvents: {
    root: readonly ["click", "keydown"];
};
export type ToggleEvents = GroupedEvents<typeof toggleEvents>;
export type ToggleComponentEvents = MeltComponentEvents<ToggleEvents>;
