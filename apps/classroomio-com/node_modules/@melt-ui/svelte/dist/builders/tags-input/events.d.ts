import type { GroupedEvents, MeltComponentEvents } from '../../internal/types.js';
export declare const tagsInputEvents: {
    root: readonly ["mousedown"];
    input: readonly ["focus", "blur", "paste", "keydown", "input"];
    tag: readonly ["mousedown", "click", "dblclick"];
    deleteTrigger: readonly ["click", "keydown"];
    edit: readonly ["blur", "keydown", "input"];
};
export type TagsInputEvents = GroupedEvents<typeof tagsInputEvents>;
export type TagsInputComponentEvents = MeltComponentEvents<TagsInputEvents>;
