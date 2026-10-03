import * as z from 'zod';

// Response shapes for OpenAPI docs only; handlers don't validate against them. Timestamps are Postgres text, not strict ISO.
const timestamp = z.string();
const nullableTimestamp = z.string().nullable();

const GOAL_TYPES = ['complete_all', 'n_of_m', 'score', 'pass_rate', 'readiness'] as const;
const GOAL_DEADLINE_KINDS = ['absolute', 'relative_to_join', 'recurring', 'none'] as const;
const GOAL_ASSIGNMENT_STATUSES = ['not_started', 'in_progress', 'completed', 'at_risk', 'overdue', 'waived'] as const;

export const ZPublicApiCohortResponse = z.object({
  id: z.string().uuid(),
  createdAt: timestamp,
  updatedAt: nullableTimestamp,
  organizationId: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  coverImage: z.string().nullable(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'ARCHIVED']),
  createdByProfileId: z.string().uuid().nullable()
});

export const ZPublicApiCohortListItemResponse = ZPublicApiCohortResponse.extend({
  courseCount: z.number(),
  studentCount: z.number()
});

export const ZPublicApiEnrolledCohortResponse = ZPublicApiCohortListItemResponse.extend({
  roleId: z.number()
});

export const ZPublicApiCohortMemberResponse = z.object({
  id: z.string().uuid(),
  cohortId: z.string().uuid(),
  profileId: z.string().uuid().nullable(),
  roleId: z.number(),
  email: z.string().nullable(),
  createdAt: timestamp
});

export const ZPublicApiCohortMemberListItemResponse = ZPublicApiCohortMemberResponse.extend({
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

export const ZPublicApiAddCohortMembersResponse = z.object({
  added: z.array(ZPublicApiCohortMemberResponse),
  errors: z.array(
    z.object({
      index: z.number().describe('Position of the failed entry in the request members array'),
      email: z.string().nullable(),
      profileId: z.string().nullable(),
      code: z.string(),
      message: z.string()
    })
  )
});

export const ZPublicApiCohortCourseResponse = z.object({
  id: z.string().uuid(),
  cohortId: z.string().uuid(),
  courseId: z.string().uuid(),
  addedAt: timestamp
});

export const ZPublicApiCohortCourseListItemResponse = ZPublicApiCohortCourseResponse.extend({
  course: z.object({
    id: z.string().uuid(),
    title: z.string().nullable(),
    description: z.string().nullable(),
    coverImage: z.string().nullable(),
    slug: z.string().nullable(),
    status: z.string().nullable(),
    isPublished: z.boolean().nullable()
  })
});

const ZReactionRecord = z.object({
  clap: z.array(z.string()),
  smile: z.array(z.string()),
  thumbsup: z.array(z.string()),
  thumbsdown: z.array(z.string())
});

export const ZPublicApiCohortNewsfeedResponse = z.object({
  id: z.string().uuid(),
  createdAt: timestamp,
  authorId: z.string().uuid().nullable().describe('Cohort member id of the author'),
  cohortId: z.string().uuid().nullable(),
  content: z.string().nullable(),
  reaction: ZReactionRecord.nullable().describe('Cohort member ids per reaction type'),
  isPinned: z.boolean()
});

const authorFields = {
  authorProfileId: z.string().nullable(),
  authorFullname: z.string().nullable(),
  authorUsername: z.string().nullable(),
  authorAvatarUrl: z.string().nullable()
};

export const ZPublicApiCohortNewsfeedListItemResponse = ZPublicApiCohortNewsfeedResponse.extend({
  ...authorFields,
  commentCount: z.number()
});

export const ZPublicApiCohortNewsfeedPageResponse = z.object({
  items: z.array(ZPublicApiCohortNewsfeedListItemResponse),
  totalCount: z.number(),
  hasMore: z.boolean(),
  nextCursor: z.string().nullable()
});

export const ZPublicApiCohortNewsfeedCommentResponse = z.object({
  id: z.number(),
  createdAt: timestamp,
  authorId: z.string().uuid().nullable().describe('Cohort member id of the author'),
  content: z.string().nullable(),
  cohortNewsfeedId: z.string().uuid().nullable()
});

export const ZPublicApiCohortNewsfeedCommentListItemResponse =
  ZPublicApiCohortNewsfeedCommentResponse.extend(authorFields);

export const ZPublicApiCohortGoalResponse = z.object({
  id: z.string().uuid(),
  cohortId: z.string().uuid(),
  title: z.string(),
  description: z.string().nullable(),
  type: z.enum(GOAL_TYPES),
  courseIds: z.array(z.string()),
  requiredCount: z.number().nullable(),
  scoreThreshold: z.number().nullable(),
  teamPassRateThreshold: z.number().nullable(),
  deadlineKind: z.enum(GOAL_DEADLINE_KINDS),
  deadlineDate: nullableTimestamp,
  relativeDays: z.number().nullable(),
  recurringMonths: z.number().nullable(),
  reminderDaysBefore: z.array(z.number()),
  status: z.enum(['active', 'archived']),
  createdByProfileId: z.string().uuid().nullable(),
  createdAt: timestamp,
  updatedAt: timestamp
});

export const ZPublicApiCohortGoalListItemResponse = ZPublicApiCohortGoalResponse.extend({
  statusCounts: z
    .partialRecord(z.enum(GOAL_ASSIGNMENT_STATUSES), z.number())
    .describe('Learner count per assignment status; statuses with no learners are omitted')
});

export const ZPublicApiEvaluateCohortGoalsResponse = z.object({
  evaluated: z.number()
});

export const ZPublicApiCohortGoalOverviewItemResponse = z.object({
  goalId: z.string().uuid(),
  cohortId: z.string().uuid(),
  cohortName: z.string(),
  title: z.string(),
  type: z.enum(GOAL_TYPES),
  deadlineKind: z.enum(GOAL_DEADLINE_KINDS),
  totalLearners: z.number(),
  completedCount: z.number(),
  inProgressCount: z.number(),
  atRiskCount: z.number(),
  overdueCount: z.number(),
  notStartedCount: z.number(),
  waivedCount: z.number(),
  onTrackPct: z.number()
});

export const ZPublicApiMyCohortGoalResponse = z.object({
  id: z.string().uuid(),
  goalId: z.string().uuid(),
  cohortMemberId: z.string().uuid(),
  dueDate: nullableTimestamp,
  status: z.enum(GOAL_ASSIGNMENT_STATUSES),
  completedCount: z.number(),
  requiredCount: z.number(),
  completedAt: nullableTimestamp,
  lastEvaluatedAt: nullableTimestamp,
  createdAt: timestamp,
  updatedAt: timestamp,
  goal: ZPublicApiCohortGoalResponse,
  cohortId: z.string().uuid(),
  cohortName: z.string()
});

export const ZPublicApiInviteStudentsToCohortResponse = z.object({
  imported: z.number(),
  enrolled: z.number(),
  emailsSent: z.number().describe('Emails queued for delivery, not confirmed delivered'),
  emailsFailed: z.number(),
  rows: z.array(
    z.object({
      email: z.string(),
      name: z.string().optional(),
      status: z.enum([
        'ready',
        'already_member',
        'invalid_email',
        'duplicate_in_file',
        'is_staff',
        'over_seat_limit',
        'missing_email'
      ])
    })
  ),
  assigned: z.number().optional(),
  alreadyEnrolledInCourses: z.number().optional(),
  alreadyEnrolledInCohorts: z.number().optional(),
  pendingInvitesRenewed: z.number().optional(),
  truncated: z.number().optional()
});

export const ZPublicApiAssignStudentsToCohortResponse = z.object({
  assigned: z.number(),
  alreadyEnrolled: z.number(),
  emailsSent: z.number()
});

export const ZPublicApiCohortInviteLinkResponse = z.object({
  id: z.string().uuid(),
  token: z.string(),
  inviteLink: z.string().describe('Full join URL to share with students'),
  isRevoked: z.boolean(),
  joinCount: z.number(),
  lastUsedAt: nullableTimestamp
});
