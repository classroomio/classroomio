import * as z from 'zod';

import { COURSE_FORMAT_VALUES } from '../../constants/course-format';
import { COURSE_TYPE_VALUES } from '../../constants/course-type';
import { COURSE_PROGRESSION_MODES } from '../../functions/course-progression';
import { ZCourseImportDraftPayload } from '../course-import/course-import';

// Response shapes for OpenAPI docs only; handlers don't validate against them. Timestamps are Postgres text, not strict ISO.
const nullableTimestamp = z.string().nullable();

const roleId = z.number().describe('1 = admin, 2 = tutor, 3 = student');

const ZCourseMetadata = z
  .object({
    requirements: z.string().optional(),
    description: z.string().optional(),
    goals: z.string().optional(),
    videoUrl: z.string().optional(),
    showDiscount: z.boolean().optional(),
    discount: z.number().optional(),
    paymentEnabled: z.boolean().optional(),
    paymentLink: z.string().optional(),
    reward: z.object({ show: z.boolean(), description: z.string().optional() }).optional(),
    instructor: z
      .object({
        name: z.string(),
        role: z.string(),
        coursesNo: z.number().optional(),
        description: z.string(),
        imgUrl: z.string()
      })
      .optional(),
    certificate: z.object({ templateUrl: z.string() }).optional(),
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
    skills: z.array(z.string()).optional(),
    tools: z.array(z.string()).optional(),
    lessonTabsOrder: z.array(z.object({ id: z.number(), name: z.string() })).optional(),
    grading: z.boolean().optional(),
    lessonDownload: z.boolean().optional(),
    allowSelfEnrollment: z.boolean().optional(),
    allowNewStudent: z.boolean().optional().describe('Deprecated; use allowSelfEnrollment'),
    allowMarkdownExport: z.boolean().optional(),
    welcomeEmailMessage: z.string().nullable().optional(),
    sessionTimezone: z.string().nullable().optional(),
    liveSessionReminderOffsetsMinutes: z.array(z.number()).optional(),
    sectionDisplay: z.record(z.string(), z.boolean()).optional(),
    isContentGroupingEnabled: z.boolean().optional(),
    progressionMode: z.enum(COURSE_PROGRESSION_MODES).optional(),
    commentsEnabled: z.boolean().optional(),
    aiTutor: z.record(z.string(), z.unknown()).optional().describe('Per-course AI tutor overrides')
  })
  .catchall(z.unknown());

const ZCourseCertificateSignatory = z.object({
  name: z.string(),
  role: z.string(),
  enabled: z.boolean().optional(),
  signatureUrl: z.string().optional()
});

const ZCourseCertificate = z
  .object({
    isDownloadable: z.boolean().optional(),
    theme: z.string().optional().describe('Deprecated; use design.templateId'),
    design: z
      .object({
        templateId: z.enum(['classique', 'brutalist', 'noir', 'poster', 'minimal']),
        accentColor: z.string(),
        subtitle: z.string().optional(),
        descriptionOverride: z.string().optional(),
        signatories: z.array(ZCourseCertificateSignatory).optional(),
        idFormat: z.string().optional()
      })
      .optional(),
    deadline: z.string().nullable().optional(),
    emailMessage: z.string().nullable().optional()
  })
  .catchall(z.unknown());

const ZCourseCompliance = z
  .object({
    retakeIntervalMonths: z.number(),
    gracePeriodDays: z.number().optional(),
    reminderDaysBefore: z.array(z.number()).optional(),
    isMandatory: z.boolean().optional(),
    framework: z.enum(['HIPAA', 'OSHA', 'SOX', 'GDPR', 'PCI_DSS', 'FERPA', 'ISO', 'CUSTOM']).nullable().optional(),
    maxRetakeAttempts: z.number().nullable().optional()
  })
  .catchall(z.unknown());

const ZCourseCallout = z.object({
  title: z.string(),
  description: z.string(),
  buttonLabel: z.string(),
  buttonUrl: z.string(),
  animation: z.enum(['waves', 'dotted', 'none']).optional()
});

export const ZPublicApiCourseResponse = z.object({
  id: z.string().uuid(),
  title: z.string(),
  description: z.string(),
  overview: z.string().nullable(),
  createdAt: nullableTimestamp,
  updatedAt: nullableTimestamp,
  groupId: z.string().uuid().nullable(),
  isTemplate: z.boolean(),
  templateId: z.string().uuid().nullable(),
  publicForAll: z.boolean(),
  seedKey: z.string().nullable(),
  logo: z.string().describe('Deprecated; use bannerImage'),
  slug: z.string().nullable(),
  metadata: ZCourseMetadata,
  cost: z.number().nullable(),
  currency: z.string(),
  bannerImage: z.string().nullable(),
  isPublished: z.boolean().nullable(),
  displayOrder: z.number().nullable(),
  certificate: ZCourseCertificate.nullable(),
  compliance: ZCourseCompliance.nullable(),
  status: z.string().describe('ACTIVE, or DELETED once the course is deleted'),
  type: z.enum(COURSE_TYPE_VALUES).nullable(),
  format: z.enum(COURSE_FORMAT_VALUES),
  callout: ZCourseCallout.nullable()
});

export const ZPublicApiCourseListItemResponse = ZPublicApiCourseResponse.extend({
  lessonCount: z.number(),
  totalStudents: z.number(),
  exerciseCount: z.number(),
  tags: z.array(
    z.object({
      id: z.string().uuid(),
      name: z.string(),
      slug: z.string(),
      color: z.string()
    })
  )
});

const ZCourseContentItem = z.object({
  id: z.string().uuid(),
  type: z.enum(['LESSON', 'EXERCISE']),
  title: z.string(),
  order: z.number().nullable(),
  createdAt: nullableTimestamp,
  sectionId: z.string().uuid().nullable(),
  isUnlocked: z.boolean().nullable(),
  isComplete: z.boolean().nullable(),
  lessonAt: nullableTimestamp,
  callUrl: z.string().nullable(),
  sessionDurationMinutes: z.number().nullable(),
  recordingUrl: z.string().nullable(),
  hasNoteContent: z.boolean().nullable(),
  hasSlideContent: z.boolean().nullable(),
  videosCount: z.number().nullable(),
  documentsCount: z.number().nullable(),
  questionCount: z.number().nullable(),
  dueBy: nullableTimestamp
});

export const ZPublicApiCourseDetailResponse = ZPublicApiCourseResponse.extend({
  group: z
    .object({
      id: z.string().uuid(),
      name: z.string(),
      description: z.string().nullable(),
      createdAt: nullableTimestamp,
      updatedAt: nullableTimestamp,
      organizationId: z.string().uuid().nullable(),
      members: z.array(
        z.object({
          id: z.string().uuid(),
          groupId: z.string().uuid(),
          roleId,
          profileId: z.string().uuid().nullable(),
          email: z.string().nullable(),
          createdAt: nullableTimestamp,
          assignedStudentId: z.string().nullable(),
          certificateEarnedAt: nullableTimestamp,
          certificationEmailSentAt: nullableTimestamp,
          profile: z
            .object({
              id: z.string().uuid(),
              fullname: z.string().nullable(),
              username: z.string().nullable(),
              avatarUrl: z.string().nullable(),
              email: z.string().nullable()
            })
            .nullable()
        })
      )
    })
    .nullable(),
  attendance: z.array(
    z.object({
      id: z.number(),
      createdAt: nullableTimestamp,
      updatedAt: nullableTimestamp,
      courseId: z.string().uuid().nullable(),
      studentId: z.string().uuid().nullable().describe('Course member id'),
      isPresent: z.boolean().nullable(),
      lessonId: z.string().uuid()
    })
  ),
  content: z.object({
    grouped: z.boolean().describe('true when content is organized into sections'),
    sections: z.array(
      z.object({
        id: z.string().describe('Section id, or "ungrouped" for items that belong to no section'),
        title: z.string(),
        order: z.number().nullable(),
        items: z.array(ZCourseContentItem)
      })
    ),
    items: z.array(ZCourseContentItem).describe('Filled only when grouped is false'),
    outline: z
      .array(
        z.discriminatedUnion('kind', [
          z.object({ kind: z.literal('section'), id: z.string() }),
          z.object({ kind: z.literal('item'), id: z.string().uuid(), type: z.enum(['LESSON', 'EXERCISE']) })
        ])
      )
      .describe(
        'Top-level reading order: sections and lessons or exercises outside any section, in course order. Items inside a section follow sections[].items.'
      )
  }),
  studentLimitReached: z.boolean(),
  org: z
    .object({
      id: z.string().uuid(),
      name: z.string(),
      siteName: z.string(),
      theme: z.string().optional()
    })
    .optional()
});

export const ZPublicApiCreateCourseResponse = z.object({
  course: ZPublicApiCourseResponse,
  groupId: z.string().uuid(),
  memberId: z.string().uuid().describe("The key creator's course member id; they are added as a tutor")
});

export const ZPublicApiCourseConversionOffenderResponse = z.object({
  questionId: z.union([z.number(), z.string()]),
  questionTitle: z.string(),
  exerciseId: z.string(),
  exerciseTitle: z.string(),
  typeId: z.number()
});

export const ZPublicApiUpdateCourseEnvelope = z.object({
  conversionBlocked: z
    .array(ZPublicApiCourseConversionOffenderResponse)
    .optional()
    .describe('Set when a type change was skipped because these questions cannot be auto-graded')
});

export const ZPublicApiCourseStructureResponse = z.object({
  courseId: z.string().uuid(),
  draft: ZCourseImportDraftPayload
});

export const ZPublicApiUpdateCourseStructureResponse = z.object({
  draftId: z.string().uuid(),
  syncMode: z.enum(['merge', 'replace']),
  courseId: z.string().uuid(),
  courseUrl: z.string(),
  bannerImageUrl: z.string().nullable(),
  tagNames: z.array(z.string()),
  localeCount: z.number(),
  createdSections: z.number(),
  createdLessons: z.number(),
  createdExercises: z.number(),
  createdLessonLanguages: z.number(),
  updatedSections: z.number(),
  updatedLessons: z.number(),
  updatedExercises: z.number(),
  updatedLessonLanguages: z.number(),
  deletedSections: z.number(),
  deletedLessons: z.number(),
  deletedExercises: z.number(),
  deletedLessonLanguages: z.number(),
  untouchedSections: z.number(),
  untouchedLessons: z.number(),
  untouchedExercises: z.number()
});
