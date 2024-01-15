import type { GroupedEvents, MeltComponentEvents } from '../../internal/types.js';
export declare const switchEvents: {
    root: readonly ["click", "keydown"];
};
export type SwitchEvents = GroupedEvents<typeof switchEvents>;
export type SwitchComponentEvents = MeltComponentEvents<SwitchEvents>;
