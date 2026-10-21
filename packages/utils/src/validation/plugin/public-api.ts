import * as z from 'zod';

export const ZPluginApiResourceRef = z
  .object({
    type: z.enum(['lesson', 'course', 'certificate', 'organization']),
    id: z.string().uuid()
  })
  .strict();
export type TPluginApiResourceRef = z.infer<typeof ZPluginApiResourceRef>;

export const ZPluginApiAuthContext = z
  .object({
    pluginId: z.string().min(1),
    versionId: z.string().uuid(),
    installationId: z.string().uuid(),
    organizationId: z.string().uuid(),
    actorId: z.string().uuid(),
    organizationRole: z.enum(['admin', 'tutor', 'student']),
    contributionTarget: z.string().min(1),
    resource: ZPluginApiResourceRef.nullable(),
    scopes: z.array(z.string().min(1))
  })
  .strict();
export type TPluginApiAuthContext = z.infer<typeof ZPluginApiAuthContext>;

export const ZPluginApiCursor = z.string().min(1).max(2048);

export const ZPluginApiOrganizationProfile = z
  .object({
    id: z.string().uuid(),
    name: z.string().min(1),
    avatarUrl: z.string().min(1).nullable(),
    locale: z.string().min(2).max(16)
  })
  .strict();
export type TPluginApiOrganizationProfile = z.infer<typeof ZPluginApiOrganizationProfile>;

export const ZPluginApiOrganizationProfileSuccess = z
  .object({
    success: z.literal(true),
    data: ZPluginApiOrganizationProfile,
    requestId: z.string().uuid()
  })
  .strict();
export type TPluginApiOrganizationProfileSuccess = z.infer<typeof ZPluginApiOrganizationProfileSuccess>;

export const ZPluginApiIdentityProfile = z
  .object({
    id: z.string().uuid(),
    displayName: z.string().min(1),
    avatarUrl: z.string().min(1).nullable(),
    locale: z.string().min(2).max(16),
    role: z.enum(['admin', 'tutor', 'student'])
  })
  .strict();
export type TPluginApiIdentityProfile = z.infer<typeof ZPluginApiIdentityProfile>;

export const ZPluginApiIdentityProfileSuccess = z
  .object({
    success: z.literal(true),
    data: ZPluginApiIdentityProfile,
    requestId: z.string().uuid()
  })
  .strict();
export type TPluginApiIdentityProfileSuccess = z.infer<typeof ZPluginApiIdentityProfileSuccess>;

export const ZPluginApiCursorPage = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z
    .object({
      items: z.array(itemSchema),
      nextCursor: z.string().nullable()
    })
    .strict();

export const ZPluginApiCourseMetadata = z
  .object({
    id: z.string().uuid(),
    title: z.string().min(1),
    slug: z.string().nullable(),
    description: z.string().nullable(),
    imageUrl: z.string().nullable(),
    status: z.string().min(1),
    visibility: z.enum(['public', 'private']),
    published: z.boolean(),
    publishedAt: z.string().datetime({ offset: true }).nullable(),
    createdAt: z.string().datetime({ offset: true }),
    updatedAt: z.string().datetime({ offset: true })
  })
  .strict();
export type TPluginApiCourseMetadata = z.infer<typeof ZPluginApiCourseMetadata>;

export const ZPluginApiCourseListResponse = z
  .object({
    success: z.literal(true),
    data: ZPluginApiCursorPage(ZPluginApiCourseMetadata),
    requestId: z.string().uuid()
  })
  .strict();
export type TPluginApiCourseListResponse = z.infer<typeof ZPluginApiCourseListResponse>;

export const ZPluginApiCourseGetResponse = z
  .object({
    success: z.literal(true),
    data: ZPluginApiCourseMetadata,
    requestId: z.string().uuid()
  })
  .strict();
export type TPluginApiCourseGetResponse = z.infer<typeof ZPluginApiCourseGetResponse>;

export const ZPluginApiLessonMetadata = z
  .object({
    id: z.string().uuid(),
    courseId: z.string().uuid(),
    title: z.string().min(1),
    type: z.string().min(1),
    order: z.number().int(),
    published: z.boolean(),
    wordCount: z.number().int().nonnegative(),
    estimatedMinutes: z.number().int().positive(),
    createdAt: z.string().datetime({ offset: true }),
    updatedAt: z.string().datetime({ offset: true })
  })
  .strict();
export type TPluginApiLessonMetadata = z.infer<typeof ZPluginApiLessonMetadata>;

export const ZPluginApiLessonListResponse = z
  .object({
    success: z.literal(true),
    data: ZPluginApiCursorPage(ZPluginApiLessonMetadata),
    requestId: z.string().uuid()
  })
  .strict();
export type TPluginApiLessonListResponse = z.infer<typeof ZPluginApiLessonListResponse>;

export const ZPluginApiLessonGetResponse = z
  .object({
    success: z.literal(true),
    data: ZPluginApiLessonMetadata,
    requestId: z.string().uuid()
  })
  .strict();
export type TPluginApiLessonGetResponse = z.infer<typeof ZPluginApiLessonGetResponse>;

export const ZPluginApiCourseSectionLessonRef = z
  .object({
    id: z.string().uuid(),
    title: z.string().min(1),
    order: z.number().int(),
    type: z.string().min(1)
  })
  .strict();
export type TPluginApiCourseSectionLessonRef = z.infer<typeof ZPluginApiCourseSectionLessonRef>;

export const ZPluginApiCourseSection = z
  .object({
    id: z.string().uuid(),
    title: z.string().min(1),
    order: z.number().int(),
    lessons: z.array(ZPluginApiCourseSectionLessonRef)
  })
  .strict();
export type TPluginApiCourseSection = z.infer<typeof ZPluginApiCourseSection>;

export const ZPluginApiCourseStructure = z
  .object({
    courseId: z.string().uuid(),
    sections: z.array(ZPluginApiCourseSection)
  })
  .strict();
export type TPluginApiCourseStructure = z.infer<typeof ZPluginApiCourseStructure>;

export const ZPluginApiCourseStructureResponse = z
  .object({
    success: z.literal(true),
    data: ZPluginApiCourseStructure,
    requestId: z.string().uuid()
  })
  .strict();
export type TPluginApiCourseStructureResponse = z.infer<typeof ZPluginApiCourseStructureResponse>;

export const ZPluginApiLessonAttachment = z
  .object({
    name: z.string().min(1),
    url: z.string().min(1),
    type: z.string().min(1),
    size: z.number().int().nonnegative().optional()
  })
  .strict();
export type TPluginApiLessonAttachment = z.infer<typeof ZPluginApiLessonAttachment>;

export const ZPluginApiLessonContent = z
  .object({
    id: z.string().uuid(),
    courseId: z.string().uuid(),
    title: z.string().min(1),
    type: z.string().min(1),
    order: z.number().int(),
    content: z.string().nullable(),
    attachments: z.array(ZPluginApiLessonAttachment),
    wordCount: z.number().int().nonnegative(),
    estimatedMinutes: z.number().int().positive(),
    updatedAt: z.string().datetime({ offset: true })
  })
  .strict();
export type TPluginApiLessonContent = z.infer<typeof ZPluginApiLessonContent>;

export const ZPluginApiLessonContentResponse = z
  .object({
    success: z.literal(true),
    data: ZPluginApiLessonContent,
    requestId: z.string().uuid()
  })
  .strict();
export type TPluginApiLessonContentResponse = z.infer<typeof ZPluginApiLessonContentResponse>;

export const ZPluginApiCourseEnrollment = z
  .object({
    id: z.string().uuid(),
    courseId: z.string().uuid(),
    profileId: z.string().uuid(),
    role: z.enum(['admin', 'tutor', 'student']),
    status: z.enum(['active', 'completed']),
    enrolledAt: z.string().datetime({ offset: true }),
    completedAt: z.string().datetime({ offset: true }).nullable()
  })
  .strict();
export type TPluginApiCourseEnrollment = z.infer<typeof ZPluginApiCourseEnrollment>;

export const ZPluginApiEnrollmentListResponse = z
  .object({
    success: z.literal(true),
    data: ZPluginApiCursorPage(ZPluginApiCourseEnrollment),
    requestId: z.string().uuid()
  })
  .strict();
export type TPluginApiEnrollmentListResponse = z.infer<typeof ZPluginApiEnrollmentListResponse>;

export const ZPluginApiEnrollmentGetResponse = z
  .object({
    success: z.literal(true),
    data: ZPluginApiCourseEnrollment,
    requestId: z.string().uuid()
  })
  .strict();
export type TPluginApiEnrollmentGetResponse = z.infer<typeof ZPluginApiEnrollmentGetResponse>;

export const ZPluginApiExerciseMetadata = z
  .object({
    id: z.string().uuid(),
    courseId: z.string().uuid(),
    lessonId: z.string().uuid().nullable(),
    title: z.string().min(1),
    description: z.string().nullable(),
    order: z.number().int(),
    allowMultipleAttempts: z.boolean(),
    completionPolicy: z.string().min(1),
    passThreshold: z.number().int().nullable(),
    questionCount: z.number().int().nonnegative(),
    totalPoints: z.number().nonnegative(),
    createdAt: z.string().datetime({ offset: true }),
    updatedAt: z.string().datetime({ offset: true })
  })
  .strict();
export type TPluginApiExerciseMetadata = z.infer<typeof ZPluginApiExerciseMetadata>;

export const ZPluginApiExerciseListResponse = z
  .object({
    success: z.literal(true),
    data: ZPluginApiCursorPage(ZPluginApiExerciseMetadata),
    requestId: z.string().uuid()
  })
  .strict();
export type TPluginApiExerciseListResponse = z.infer<typeof ZPluginApiExerciseListResponse>;

export const ZPluginApiExerciseGetResponse = z
  .object({
    success: z.literal(true),
    data: ZPluginApiExerciseMetadata,
    requestId: z.string().uuid()
  })
  .strict();
export type TPluginApiExerciseGetResponse = z.infer<typeof ZPluginApiExerciseGetResponse>;

export const ZPluginApiIssuedCertificate = z
  .object({
    id: z.string().uuid(),
    courseId: z.string().uuid(),
    profileId: z.string().uuid(),
    cycleNumber: z.number().int(),
    issuedAt: z.string().datetime({ offset: true }),
    expiresAt: z.string().datetime({ offset: true }),
    status: z.string().min(1),
    verificationUrl: z.string().url().nullable()
  })
  .strict();
export type TPluginApiIssuedCertificate = z.infer<typeof ZPluginApiIssuedCertificate>;

export const ZPluginApiIssuedCertificateListResponse = z
  .object({
    success: z.literal(true),
    data: ZPluginApiCursorPage(ZPluginApiIssuedCertificate),
    requestId: z.string().uuid()
  })
  .strict();
export type TPluginApiIssuedCertificateListResponse = z.infer<typeof ZPluginApiIssuedCertificateListResponse>;

export const ZPluginApiIssuedCertificateGetResponse = z
  .object({
    success: z.literal(true),
    data: ZPluginApiIssuedCertificate,
    requestId: z.string().uuid()
  })
  .strict();
export type TPluginApiIssuedCertificateGetResponse = z.infer<typeof ZPluginApiIssuedCertificateGetResponse>;

export const ZPluginApiListQuery = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20).optional(),
  cursor: ZPluginApiCursor.optional()
});
export type TPluginApiListQuery = z.infer<typeof ZPluginApiListQuery>;

export const ZPluginApiLessonListQuery = ZPluginApiListQuery.extend({
  courseId: z.string().uuid().optional()
});
export type TPluginApiLessonListQuery = z.infer<typeof ZPluginApiLessonListQuery>;

export const ZPluginApiLessonProgress = z
  .object({
    isComplete: z.boolean()
  })
  .strict();
export type TPluginApiLessonProgress = z.infer<typeof ZPluginApiLessonProgress>;

export const ZPluginApiLessonProgressUpdate = z
  .object({
    isComplete: z.boolean()
  })
  .strict();
export type TPluginApiLessonProgressUpdate = z.infer<typeof ZPluginApiLessonProgressUpdate>;

export const ZPluginApiLessonProgressResponse = z
  .object({
    success: z.literal(true),
    data: ZPluginApiLessonProgress,
    requestId: z.string().uuid()
  })
  .strict();
export type TPluginApiLessonProgressResponse = z.infer<typeof ZPluginApiLessonProgressResponse>;

export const ZPluginApiCourseProgress = z
  .object({
    courseId: z.string().uuid(),
    percentage: z.number().int().min(0).max(100),
    lessonsCompleted: z.number().int().nonnegative(),
    totalLessons: z.number().int().nonnegative(),
    isComplete: z.boolean(),
    certificateEarnedAt: z.string().datetime({ offset: true }).nullable()
  })
  .strict();
export type TPluginApiCourseProgress = z.infer<typeof ZPluginApiCourseProgress>;

export const ZPluginApiCourseProgressResponse = z
  .object({
    success: z.literal(true),
    data: ZPluginApiCourseProgress,
    requestId: z.string().uuid()
  })
  .strict();
export type TPluginApiCourseProgressResponse = z.infer<typeof ZPluginApiCourseProgressResponse>;

export const ZPluginApiCertificateTemplate = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1),
    style: z.string().min(1),
    description: z.string().min(1),
    accentColor: z.string().min(1),
    subtitle: z.string().min(1),
    version: z.number().int().positive().default(1),
    design: z.record(z.string(), z.unknown())
  })
  .strict();
export type TPluginApiCertificateTemplate = z.infer<typeof ZPluginApiCertificateTemplate>;

export const ZPluginApiCertificateTemplateListResponse = z
  .object({
    success: z.literal(true),
    data: z.array(ZPluginApiCertificateTemplate),
    requestId: z.string().uuid()
  })
  .strict();
export type TPluginApiCertificateTemplateListResponse = z.infer<typeof ZPluginApiCertificateTemplateListResponse>;

export const ZPluginApiAppliedCertificateTemplate = z
  .object({
    courseId: z.string().uuid(),
    isDownloadable: z.boolean(),
    design: z.record(z.string(), z.unknown()).nullable(),
    sourceTemplate: z
      .object({
        pluginId: z.string().min(1),
        externalTemplateId: z.string().min(1),
        version: z.number().int(),
        name: z.string().min(1),
        appliedAt: z.string().datetime({ offset: true })
      })
      .nullable()
  })
  .strict();
export type TPluginApiAppliedCertificateTemplate = z.infer<typeof ZPluginApiAppliedCertificateTemplate>;

export const ZPluginApiAppliedCertificateTemplateResponse = z
  .object({
    success: z.literal(true),
    data: ZPluginApiAppliedCertificateTemplate,
    requestId: z.string().uuid()
  })
  .strict();
export type TPluginApiAppliedCertificateTemplateResponse = z.infer<typeof ZPluginApiAppliedCertificateTemplateResponse>;

export const ZPluginApiApplyCertificateTemplate = z
  .object({
    externalTemplateId: z.string().min(1),
    externalTemplateVersion: z.number().int().positive(),
    name: z.string().min(1),
    design: z.record(z.string(), z.unknown())
  })
  .strict();
export type TPluginApiApplyCertificateTemplate = z.infer<typeof ZPluginApiApplyCertificateTemplate>;

export const ZPluginApiApplyCertificateTemplateResult = z
  .object({
    courseId: z.string().uuid(),
    appliedAt: z.string().datetime({ offset: true }),
    templateVersion: z.number().int(),
    design: z.record(z.string(), z.unknown())
  })
  .strict();
export type TPluginApiApplyCertificateTemplateResult = z.infer<typeof ZPluginApiApplyCertificateTemplateResult>;

export const ZPluginApiApplyCertificateTemplateResponse = z
  .object({
    success: z.literal(true),
    data: ZPluginApiApplyCertificateTemplateResult,
    requestId: z.string().uuid()
  })
  .strict();
export type TPluginApiApplyCertificateTemplateResponse = z.infer<typeof ZPluginApiApplyCertificateTemplateResponse>;

export const ZPluginApiStorageScope = z.enum(['organization', 'user', 'owner']);
export type TPluginApiStorageScope = z.infer<typeof ZPluginApiStorageScope>;

export const ZPluginApiStorageRecord = z
  .object({
    namespace: z.string().min(1).max(128),
    key: z.string().min(1).max(255),
    value: z.unknown(),
    scope: z.enum(['organization', 'user']),
    updatedAt: z.string().datetime({ offset: true }).optional()
  })
  .strict();
export type TPluginApiStorageRecord = z.infer<typeof ZPluginApiStorageRecord>;

export const ZPluginApiStorageRecordResponse = z
  .object({
    success: z.literal(true),
    data: ZPluginApiStorageRecord,
    requestId: z.string().uuid()
  })
  .strict();
export type TPluginApiStorageRecordResponse = z.infer<typeof ZPluginApiStorageRecordResponse>;

export const ZPluginApiStorageListResponse = z
  .object({
    success: z.literal(true),
    data: z
      .object({
        items: z.array(ZPluginApiStorageRecord)
      })
      .strict(),
    requestId: z.string().uuid()
  })
  .strict();
export type TPluginApiStorageListResponse = z.infer<typeof ZPluginApiStorageListResponse>;

export const ZPluginApiStorageSet = z
  .object({
    value: z.unknown(),
    scope: z.enum(['organization', 'user', 'owner']).default('organization')
  })
  .strict();
export type TPluginApiStorageSet = z.infer<typeof ZPluginApiStorageSet>;

export const ZPluginApiStorageDeleteResponse = z
  .object({
    success: z.literal(true),
    data: z
      .object({
        deleted: z.boolean()
      })
      .strict(),
    requestId: z.string().uuid()
  })
  .strict();
export type TPluginApiStorageDeleteResponse = z.infer<typeof ZPluginApiStorageDeleteResponse>;

export const ZPluginApiError = z
  .object({
    success: z.literal(false),
    error: z
      .object({
        code: z.string().min(1),
        message: z.string().min(1),
        retryable: z.boolean(),
        details: z.record(z.string(), z.unknown()).optional()
      })
      .strict(),
    requestId: z.string().uuid()
  })
  .strict();
export type TPluginApiError = z.infer<typeof ZPluginApiError>;
