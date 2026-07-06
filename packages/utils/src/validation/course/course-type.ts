import * as z from 'zod';

import { COURSE_TYPE_VALUES, type TCourseType } from '../../constants/course-type';

/** Zod schema for Postgres `COURSE_TYPE` — values come from shared constants. */
export const ZCourseType = z.enum(COURSE_TYPE_VALUES);

export { COURSE_TYPE_VALUES, type TCourseType };
