import * as z from 'zod';

import { COURSE_TYPE_VALUES, type TCourseType } from '../../constants/course-type';
import { COURSE_FORMAT_VALUES, type TCourseFormat } from '../../constants/course-format';

/** Zod schema for Postgres `COURSE_TYPE` — values come from shared constants. */
export const ZCourseType = z.enum(COURSE_TYPE_VALUES);

export const ZCourseFormat = z.enum(COURSE_FORMAT_VALUES);

export interface NonAutoGradableQuestionOffender {
  questionId: number | string;
  questionTitle: string;
  exerciseId: string;
  exerciseTitle: string;
  typeId: number;
}

export { COURSE_TYPE_VALUES, type TCourseType };
export { COURSE_FORMAT_VALUES, type TCourseFormat };
