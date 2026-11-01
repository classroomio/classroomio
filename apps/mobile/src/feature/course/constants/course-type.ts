import type { TCourseType } from '@cio/utils/constants/course-type';

import type { en } from '@/feature/course/translations/en';

/** `courseCatalog` keys for each course type. */
export const COURSE_TYPE_KEYS = {
  SELF_PACED: 'courseTypeSelfPaced',
  LIVE_CLASS: 'courseTypeLiveClass',
  COMPLIANCE: 'courseTypeCompliance',
  PUBLIC: 'courseTypePublic'
} as const satisfies Record<TCourseType, keyof typeof en>;

/** The `courseCatalog` key for an API course type, or null when the type is unknown. */
export function courseTypeKey(type: string | null | undefined) {
  return type && type in COURSE_TYPE_KEYS ? COURSE_TYPE_KEYS[type as TCourseType] : null;
}

/** English only; prefer `COURSE_TYPE_KEYS` with `courseCatalog`. */
export const COURSE_TYPE_LABELS: Record<TCourseType, string> = {
  SELF_PACED: 'Self-paced',
  LIVE_CLASS: 'Live class',
  COMPLIANCE: 'Compliance',
  PUBLIC: 'Public'
};
