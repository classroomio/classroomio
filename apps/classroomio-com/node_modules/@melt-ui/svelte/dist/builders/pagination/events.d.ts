import type { GroupedEvents, MeltComponentEvents } from '../../internal/types.js';
export declare const paginationEvents: {
    pageTrigger: readonly ["click", "keydown"];
    nextButton: readonly ["click", "keydown"];
    prevButton: readonly ["click", "keydown"];
};
export type PaginationEvents = GroupedEvents<typeof paginationEvents>;
export type PaginationComponentEvents = MeltComponentEvents<PaginationEvents>;
