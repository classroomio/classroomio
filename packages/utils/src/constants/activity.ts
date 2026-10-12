export const ACTIVITY_KINDS = ['scorm'] as const;

export type TActivityKind = (typeof ACTIVITY_KINDS)[number];
