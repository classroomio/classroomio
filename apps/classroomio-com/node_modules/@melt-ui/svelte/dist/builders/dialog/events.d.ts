import type { GroupedEvents, MeltComponentEvents } from '../../internal/types.js';
export declare const dialogEvents: {
    trigger: readonly ["click", "keydown"];
    close: readonly ["click", "keydown"];
};
export type DialogEvents = GroupedEvents<typeof dialogEvents>;
export type DialogComponentEvents = MeltComponentEvents<DialogEvents>;
