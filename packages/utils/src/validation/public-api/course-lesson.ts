import * as z from 'zod';

import { ZPublicApiCourseParam } from './course';
import { ZPublicApiPaginationQuery } from './pagination';

export const ZPublicApiCourseLessonParam = ZPublicApiCourseParam.extend({
  lessonId: z.string().uuid()
});
export type TPublicApiCourseLessonParam = z.infer<typeof ZPublicApiCourseLessonParam>;

export const ZPublicApiCourseLessonsQuery = ZPublicApiPaginationQuery.extend({
  sectionId: z.string().uuid().optional().describe('Only lessons in this section')
});
export type TPublicApiCourseLessonsQuery = z.infer<typeof ZPublicApiCourseLessonsQuery>;
