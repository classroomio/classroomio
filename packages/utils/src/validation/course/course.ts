import * as z from 'zod';

import { ALLOWED_CONTENT_TYPES, ALLOWED_DOCUMENT_TYPES } from '../constants';

export const ZCourseClone = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  slug: z.string().min(1),
  organizationId: z.string().min(1)
});
export type TCourseClone = z.infer<typeof ZCourseClone>;

export const ZCourseCloneParam = z.object({
  courseId: z.string().min(1)
});
export type TCourseCloneParam = z.infer<typeof ZCourseCloneParam>;

export const ZCourseGetParam = z.object({
  courseId: z.string().min(1)
});
export type TCourseGetParam = z.infer<typeof ZCourseGetParam>;

export const ZCourseGetQuery = z.object({
  slug: z.string().optional()
});
export type TCourseGetQuery = z.infer<typeof ZCourseGetQuery>;

export const ZCourseGetBySlugParam = z.object({
  slug: z.string().min(1)
});
export type TCourseGetBySlugParam = z.infer<typeof ZCourseGetBySlugParam>;

export const ZCourseDownloadParam = z.object({
  courseId: z.string().min(1)
});
export type TCourseDownloadParam = z.infer<typeof ZCourseDownloadParam>;

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

export const ZCourseCreate = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  type: z.enum(['LIVE_CLASS', 'SELF_PACED']),
  organizationId: z.string().min(1)
});
export type TCourseCreate = z.infer<typeof ZCourseCreate>;

// Course metadata schema matching the database structure
export const ZCourseMetadata = z.object({
  requirements: z.string().optional(),
  description: z.string().optional(),
  goals: z.string().optional(),
  videoUrl: z.string().optional(),
  showDiscount: z.boolean().optional(),
  discount: z.number().optional(),
  paymentLink: z.string().optional(),
  reward: z
    .object({
      show: z.boolean(),
      description: z.string()
    })
    .optional(),
  instructor: z
    .object({
      name: z.string(),
      role: z.string(),
      coursesNo: z.number(),
      description: z.string(),
      imgUrl: z.string()
    })
    .optional(),
  certificate: z
    .object({
      templateUrl: z.string()
    })
    .optional(),
  reviews: z
    .array(
      z.object({
        id: z.number(),
        hide: z.boolean(),
        name: z.string(),
        avatar_url: z.string(),
        rating: z.number(),
        created_at: z.number(),
        description: z.string()
      })
    )
    .optional(),
  lessonTabsOrder: z
    .array(
      z.object({
        id: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
        name: z.string()
      })
    )
    .optional(),
  grading: z.boolean().optional(),
  lessonDownload: z.boolean().optional(),
  allowNewStudent: z.boolean(),
  sectionDisplay: z.record(z.string(), z.boolean()).optional()
});
export type TCourseMetadata = z.infer<typeof ZCourseMetadata>;

export const ZCourseUpdate = z.object({
  title: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  type: z.enum(['LIVE_CLASS', 'SELF_PACED']).optional(),
  logo: z.string().optional(),
  slug: z.string().optional(),
  isPublished: z.boolean().optional(),
  overview: z.string().optional(),
  metadata: ZCourseMetadata.optional(),
  isCertificateDownloadable: z.boolean().optional(),
  certificateTheme: z.string().optional()
});
export type TCourseUpdate = z.infer<typeof ZCourseUpdate>;

export const ZCourseUpdateParam = z.object({
  courseId: z.string().min(1)
});
export type TCourseUpdateParam = z.infer<typeof ZCourseUpdateParam>;

export const ZCourseDeleteParam = z.object({
  courseId: z.string().min(1)
});
export type TCourseDeleteParam = z.infer<typeof ZCourseDeleteParam>;

export const ZCourseProgressParam = z.object({
  courseId: z.string().min(1)
});
export type TCourseProgressParam = z.infer<typeof ZCourseProgressParam>;

export const ZCourseProgressQuery = z.object({
  profileId: z.string().uuid()
});
export type TCourseProgressQuery = z.infer<typeof ZCourseProgressQuery>;

export const ZCourseUserAnalyticsParam = z.object({
  courseId: z.string().min(1),
  userId: z.string().uuid()
});
export type TCourseUserAnalyticsParam = z.infer<typeof ZCourseUserAnalyticsParam>;
