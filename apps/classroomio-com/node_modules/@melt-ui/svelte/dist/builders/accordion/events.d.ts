import type { GroupedEvents, MeltComponentEvents } from '../../internal/types.js';
export declare const accordionEvents: {
    trigger: readonly ["keydown", "click"];
};
export type AccordionEvents = GroupedEvents<typeof accordionEvents>;
export type AccordionComponentEvents = MeltComponentEvents<AccordionEvents>;
