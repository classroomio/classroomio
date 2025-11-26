import { ALLOWED_CONTENT_TYPES, ALLOWED_DOCUMENT_TYPES } from '../constants';

import { z } from 'zod';

export const ZCourseClone = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  slug: z.string().min(1),
  organizationId: z.string().min(1)
});
export type TCourseClone = z.infer<typeof ZCourseClone>;

export const ZCertificateDownload = z.object({
  theme: z.string().min(1),
  studentName: z.string().min(1),
  courseName: z.string().min(1),
  courseDescription: z.string().min(1),
  orgName: z.string().min(1),
  orgLogoUrl: z.string().url().optional(),
  facilitator: z.string().optional()
});
export type TCertificateDownload = z.infer<typeof ZCertificateDownload>;

export const ZCourseDownloadContent = z.object({
  courseTitle: z.string().min(1),
  orgName: z.string().min(1),
  orgTheme: z.string().min(1),
  lessons: z.array(
    z.object({
      lessonTitle: z.string().min(1),
      lessonNumber: z.string().min(1),
      lessonNote: z.string(),
      slideUrl: z.string().url().optional(),
      video: z.array(z.string().url()).optional()
    })
  )
});
export type TCourseDownloadContent = z.infer<typeof ZCourseDownloadContent>;

export const ZLessonDownloadContent = z.object({
  title: z.string().min(1),
  number: z.string().min(1),
  orgName: z.string().min(1),
  note: z.string(),
  slideUrl: z.string().url().optional(),
  video: z.array(z.string().url()).optional(),
  courseTitle: z.string().min(1)
});
export type TLessonDownloadContent = z.infer<typeof ZLessonDownloadContent>;

export const ZCoursePresignUrlUpload = z.object({
  fileName: z.string().min(1),
  fileType: z.enum(ALLOWED_CONTENT_TYPES)
});
export type TCoursePresignUrlUpload = z.infer<typeof ZCoursePresignUrlUpload>;

export const ZCourseDocumentPresignUrlUpload = z.object({
  fileName: z.string().min(1),
  fileType: z.enum(ALLOWED_DOCUMENT_TYPES)
});
export type TCourseDocumentPresignUrlUpload = z.infer<typeof ZCourseDocumentPresignUrlUpload>;

export const ZCourseDownloadPresignedUrl = z.object({
  keys: z.array(z.string().min(1)).min(1)
});
export type TCourseDownloadPresignedUrl = z.infer<typeof ZCourseDownloadPresignedUrl>;
