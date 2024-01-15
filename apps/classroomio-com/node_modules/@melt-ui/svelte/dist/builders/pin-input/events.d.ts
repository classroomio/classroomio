import type { GroupedEvents, MeltComponentEvents } from '../../internal/types.js';
export declare const pinInputEvents: {
    input: readonly ["keydown", "input", "paste", "change", "focus", "blur"];
};
export type PinInputEvents = GroupedEvents<typeof pinInputEvents>;
export type PinInputComponentEvents = MeltComponentEvents<PinInputEvents>;
