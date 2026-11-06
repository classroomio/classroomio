import * as z from 'zod';

import { LMS_DESTINATION_KEYS } from '@cio/utils/lms';

export const ZStudentHomeDestination = z.discriminatedUnion('type', [
  z.object({ type: z.literal('page'), key: z.enum(LMS_DESTINATION_KEYS) }),
  z.object({ type: z.literal('course'), courseId: z.uuid() })
]);

export type TStudentHomeDestination = z.infer<typeof ZStudentHomeDestination>;

export const ZStudentHomeCourseOptionsQuery = z.object({
  search: z.string().trim().max(200).optional(),
  includeCourseId: z.uuid().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20)
});

export type TStudentHomeCourseOptionsQuery = z.infer<typeof ZStudentHomeCourseOptionsQuery>;

export const ZStudentHomeResolveHeaders = z.object({
  'cio-org-id': z.uuid()
});
