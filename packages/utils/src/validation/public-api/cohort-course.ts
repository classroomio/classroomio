import * as z from 'zod';

import { ZPublicApiCohortParam } from './cohort';

export const ZPublicApiCohortCourseParam = ZPublicApiCohortParam.extend({
  courseId: z.string().uuid()
});
export type TPublicApiCohortCourseParam = z.infer<typeof ZPublicApiCohortCourseParam>;

export const ZPublicApiAddCourseToCohort = z.object({
  courseId: z.string().uuid()
});
export type TPublicApiAddCourseToCohort = z.infer<typeof ZPublicApiAddCourseToCohort>;
