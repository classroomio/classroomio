import type { GroupedEvents, MeltComponentEvents } from '../../internal/types.js';
export declare const toolbarEvents: {
    button: readonly ["keydown"];
    link: readonly ["keydown"];
    item: readonly ["click", "keydown"];
};
export type ToolbarEvents = GroupedEvents<typeof toolbarEvents>;
export type ToolbarComponentEvents = MeltComponentEvents<ToolbarEvents>;
