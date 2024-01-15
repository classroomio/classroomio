import type { GroupedEvents, MeltComponentEvents } from '../../internal/types.js';
export declare const tabsEvents: {
    trigger: readonly ["focus", "click", "keydown"];
};
export type TabsEvents = GroupedEvents<typeof tabsEvents>;
export type TabsComponentEvents = MeltComponentEvents<TabsEvents>;
