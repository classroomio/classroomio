import type { GroupedEvents, MeltComponentEvents } from '../../internal/types.js';
export declare const labelEvents: {
    root: readonly ["mousedown"];
};
export type LabelEvents = GroupedEvents<typeof labelEvents>;
export type LabelComponentEvents = MeltComponentEvents<LabelEvents>;
