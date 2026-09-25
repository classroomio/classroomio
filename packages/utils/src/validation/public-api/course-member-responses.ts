import * as z from 'zod';

// Response shapes for OpenAPI docs only; handlers don't validate against them. Timestamps are Postgres text, not strict ISO.
const timestamp = z.string();
const nullableTimestamp = z.string().nullable();

const roleId = z.number().describe('1 = admin, 2 = tutor, 3 = student');

export const ZPublicApiCourseMemberResponse = z.object({
  id: z.string().uuid(),
  groupId: z.string().uuid(),
  roleId,
  profileId: z.string().uuid().nullable(),
  email: z.string().nullable(),
  createdAt: nullableTimestamp,
  assignedStudentId: z.string().nullable(),
  certificateEarnedAt: nullableTimestamp,
  certificationEmailSentAt: nullableTimestamp
});

export const ZPublicApiCourseMemberDetailResponse = ZPublicApiCourseMemberResponse.extend({
  profile: z
    .object({
      id: z.string().uuid(),
      fullname: z.string().nullable(),
      username: z.string().nullable(),
      avatarUrl: z.string().nullable(),
      email: z.string().nullable()
    })
    .nullable()
});

export const ZPublicApiCourseMemberListItemResponse = ZPublicApiCourseMemberDetailResponse.extend({
  progressPercent: z.number().optional().describe('Students only'),
  stage: z
    .discriminatedUnion('kind', [
      z.object({ kind: z.literal('not_started') }),
      z.object({ kind: z.literal('certificate_earned') }),
      z.object({
        kind: z.literal('content'),
        position: z.number(),
        title: z.string(),
        contentType: z.enum(['lesson', 'exercise'])
      })
    ])
    .optional()
    .describe('Students only'),
  lastLoginAt: nullableTimestamp.optional().describe('Students only'),
  enrolledAt: nullableTimestamp.optional().describe('Students only')
});

export const ZPublicApiCourseMemberProgressResetResponse = z.object({
  lessonCompletion: z.number(),
  lessonVideoProgress: z.number(),
  submissions: z.number(),
  groupAttendance: z.number(),
  lessonComments: z.number(),
  courseNewsfeed: z.number(),
  courseNewsfeedComments: z.number(),
  courseCertificateIssues: z.number(),
  courseCompletionRecords: z.number(),
  aiChatConversations: z.number()
});

export const ZPublicApiCourseMemberAnalyticsResponse = z.object({
  user: z.object({
    id: z.string().uuid(),
    fullName: z.string(),
    email: z.string(),
    avatarUrl: z.string(),
    lastSeen: timestamp.optional()
  }),
  averageGrade: z.number().nullable().describe('Percentage across graded exercises; null when nothing is graded yet'),
  userExercisesStats: z.array(
    z.object({
      id: z.string().uuid(),
      lessonId: z.string().uuid().nullable(),
      lessonTitle: z.string(),
      title: z.string(),
      status: z.number().optional().describe('Submission status id; absent when not submitted'),
      score: z.number(),
      totalPoints: z.number(),
      isCompleted: z.boolean()
    })
  ),
  totalExercises: z.number(),
  completedExercises: z.number(),
  lessonsCompleted: z.number(),
  lessonsCount: z.number(),
  progressPercentage: z.number(),
  progressImpact: z
    .object({
      completedLessons: z.number(),
      totalLessons: z.number(),
      exerciseSubmissions: z.number(),
      lessonComments: z.number(),
      courseNewsfeedActivity: z.number(),
      videoProgressLessons: z.number(),
      attendanceEntries: z.number(),
      hasCertificationRecords: z.boolean()
    })
    .nullable()
    .describe('Only set when includeProgressImpact=true')
});

const inviteStatus = z.enum(['ACTIVE', 'REVOKED', 'EXPIRED', 'USED_UP']);

const ZPublicApiCourseInviteBase = z.object({
  id: z.string().uuid(),
  courseId: z.string().uuid(),
  roleId,
  expiresAt: timestamp,
  maxUses: z.number(),
  usedCount: z.number(),
  allowedEmails: z.array(z.string()).nullable(),
  allowedDomains: z.array(z.string()).nullable(),
  createdAt: timestamp,
  status: inviteStatus
});

export const ZPublicApiCourseInviteListItemResponse = ZPublicApiCourseInviteBase.extend({
  isRevoked: z.boolean(),
  updatedAt: timestamp,
  lastUsedAt: nullableTimestamp,
  revokedAt: nullableTimestamp,
  revokedByProfileId: z.string().uuid().nullable(),
  createdBy: z
    .object({
      id: z.string().uuid(),
      fullname: z.string().nullable(),
      email: z.string().nullable()
    })
    .nullable(),
  usesRemaining: z.number(),
  activity: z.object({
    previewedCount: z.number(),
    acceptedCount: z.number(),
    emailSentCount: z.number(),
    emailFailedCount: z.number(),
    lastPreviewedAt: nullableTimestamp,
    lastAcceptedAt: nullableTimestamp,
    lastEmailSentAt: nullableTimestamp
  })
});

export const ZPublicApiCreateCourseInviteResponse = z.object({
  mode: z.enum(['single', 'bulk']).describe('single = one shareable link, bulk = one invite per recipient email'),
  invites: z.array(
    ZPublicApiCourseInviteBase.extend({
      inviteLink: z.string().describe('Enroll URL containing the invite token; only returned at creation')
    })
  ),
  inviteLink: z.string().nullable(),
  duplicatesSkipped: z.array(z.string()),
  delivery: z.object({
    requested: z.number(),
    sent: z.number(),
    failed: z.number(),
    failures: z.array(z.object({ email: z.string(), error: z.string() }))
  })
});

export const ZPublicApiRevokeCourseInviteResponse = z.object({
  id: z.string().uuid(),
  status: inviteStatus,
  isRevoked: z.boolean()
});
