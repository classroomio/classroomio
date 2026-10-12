export const COURSE_FORMAT_VALUES = ['standard', 'scorm'] as const;

export type TCourseFormat = (typeof COURSE_FORMAT_VALUES)[number];
