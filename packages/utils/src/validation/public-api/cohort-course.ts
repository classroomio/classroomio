import * as z from 'zod';

import { ZAddCourseToCohort } from '../cohort/cohort';
import { ZPublicApiCohortParam } from './cohort';

export const ZPublicApiCohortCourseParam = ZPublicApiCohortParam.extend({
  courseId: z.string().uuid()
});
export type TPublicApiCohortCourseParam = z.infer<typeof ZPublicApiCohortCourseParam>;

export const ZPublicApiAddCourseToCohort = ZAddCourseToCohort;
export type TPublicApiAddCourseToCohort = z.infer<typeof ZPublicApiAddCourseToCohort>;
