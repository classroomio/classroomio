import * as z from 'zod';

import { LMS_DESTINATION_KEYS } from '@cio/utils/lms';

export const ZStudentHomeDestination = z.discriminatedUnion('type', [
  z.object({ type: z.literal('page'), key: z.enum(LMS_DESTINATION_KEYS) }),
  z.object({ type: z.literal('course'), courseId: z.uuid() })
]);

export type TStudentHomeDestination = z.infer<typeof ZStudentHomeDestination>;

export const ZStudentHomeCourseOptionsQuery = z.object({
  search: z.string().trim().max(200).optional(),
  includeCourseId: z.uuid().optional()
});

export type TStudentHomeCourseOptionsQuery = z.infer<typeof ZStudentHomeCourseOptionsQuery>;
