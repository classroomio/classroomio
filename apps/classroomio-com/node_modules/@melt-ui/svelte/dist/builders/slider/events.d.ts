import type { GroupedEvents, MeltComponentEvents } from '../../internal/types.js';
export declare const sliderEvents: {
    thumb: readonly ["keydown"];
};
export type SliderEvents = GroupedEvents<typeof sliderEvents>;
export type SliderComponentEvents = MeltComponentEvents<SliderEvents>;
