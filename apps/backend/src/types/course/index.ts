import { ALLOWED_CONTENT_TYPES, MAX_FILE_SIZE } from '$src/constants/upload';

import { z } from 'zod';

export * from './lesson';

export const ZCourseDownloadContent = z.object({
  courseTitle: z.string(),
  orgName: z.string(),
  orgTheme: z.string(),
  lessons: z.array(
    z.object({
      lessonTitle: z.string(),
      lessonNumber: z.string(),
      lessonNote: z.string(),
      slideUrl: z.string().optional(),
      video: z.array(z.string()).optional()
    })
  )
});

export type TCourseDownloadContent = z.infer<typeof ZCourseDownloadContent>;

export const ZCoursePresignUrlUpload = z.object({
  fileName: z.string().min(1, 'File name is required'),
  fileType: z.enum(ALLOWED_CONTENT_TYPES, {
    errorMap: () => ({
      message: `Invalid content type. Allowed types: ${ALLOWED_CONTENT_TYPES.join(', ')}`
    })
  })
});

export type TCoursePresignUrlUpload = z.infer<typeof ZCoursePresignUrlUpload>;

export const ZCourseDownloadPresignedUrl = z.object({
  keys: z.array(z.string()).min(1, 'File names array is required')
});

export type TCourseDownloadPresignedUrl = z.infer<typeof ZCourseDownloadPresignedUrl>;
