import type { GroupedEvents, MeltComponentEvents } from '../../internal/types.js';
export declare const radioGroupEvents: {
    item: readonly ["click", "focus", "keydown"];
};
export type RadioGroupEvents = GroupedEvents<typeof radioGroupEvents>;
export type RadioGroupComponentEvents = MeltComponentEvents<RadioGroupEvents>;
