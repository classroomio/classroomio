import type { GroupedEvents, MeltComponentEvents } from '../../internal/types.js';
export declare const checkboxEvents: {
    root: readonly ["keydown", "click"];
};
export type CheckboxEvents = GroupedEvents<typeof checkboxEvents>;
export type CheckboxComponentEvents = MeltComponentEvents<CheckboxEvents>;
