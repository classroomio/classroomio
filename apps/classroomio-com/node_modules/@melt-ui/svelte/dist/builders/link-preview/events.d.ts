import type { GroupedEvents, MeltComponentEvents } from '../../internal/types.js';
export declare const linkPreviewEvents: {
    trigger: readonly ["pointerenter", "pointerleave", "focus", "blur"];
    content: readonly ["pointerdown", "pointerenter", "pointerleave", "focusout"];
};
export type LinkPreviewEvents = GroupedEvents<typeof linkPreviewEvents>;
export type LinkPreviewComponentEvents = MeltComponentEvents<LinkPreviewEvents>;
