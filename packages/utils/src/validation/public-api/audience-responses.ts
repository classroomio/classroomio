import * as z from 'zod';

// Response shapes for OpenAPI docs only; handlers don't validate against them. Timestamps are Postgres text, not strict ISO.
const timestamp = z.string();
const nullableTimestamp = z.string().nullable();

const memberStatus = z.enum(['ACTIVE', 'ARCHIVED']);

export const ZPublicApiAudienceMemberResponse = z.object({
  id: z.number(),
  profileId: z.string().uuid().nullable().describe('null until the invited person creates an account'),
  name: z.string(),
  username: z.string().nullable().describe('null until the invited person creates an account'),
  email: z.string(),
  avatarUrl: z.string(),
  locale: z
    .string()
    .nullable()
    .describe('Language ClassroomIO is shown in for them; null until they create an account'),
  createdAt: z.string().describe('Day the member joined this organization, as a date string (e.g. "Mon Oct 05 2026")'),
  status: z.enum(['active', 'pending', 'expired', 'revoked']).describe('Invite state'),
  memberStatus: memberStatus.describe('Lifecycle state of the membership'),
  lastLoginAt: nullableTimestamp,
  lastActiveAt: nullableTimestamp,
  enrolledCount: z.number(),
  completedCount: z.number(),
  progressPercent: z.number(),
  certificateCount: z.number().describe('Courses in this organization where the learner has earned a certificate')
});

export const ZPublicApiCreateAudienceResponse = z.object({
  imported: z.number(),
  enrolled: z.number(),
  emailsSent: z.number(),
  emailsFailed: z.number(),
  rows: z.array(
    z.object({
      email: z.string(),
      name: z.string().optional(),
      status: z
        .enum([
          'ready',
          'already_member',
          'invite_resent',
          'invalid_email',
          'duplicate_in_file',
          'is_staff',
          'over_seat_limit',
          'missing_email'
        ])
        .describe('What happened to this address')
    })
  ),
  assigned: z.number(),
  alreadyEnrolledInCourses: z.number(),
  alreadyEnrolledInCohorts: z.number(),
  pendingInvitesRenewed: z.number(),
  truncated: z.number().describe('Rows beyond the import limit, which were not processed')
});

export const ZPublicApiAudienceBulkStatusResponse = z.object({
  action: z.enum(['archive', 'unarchive']),
  requested: z.number(),
  changed: z.number(),
  rows: z
    .array(
      z.object({
        index: z.number().describe('Position in memberIds or emails'),
        memberId: z.number().nullable().describe('null when not_found'),
        email: z.string().nullable().describe('The email sent, or null when memberIds was sent'),
        status: z
          .enum(['changed', 'already_in_state', 'not_found'])
          .describe(
            'changed: moved to the new state. already_in_state: was already there; nothing changed. not_found: not a student of this organization'
          )
      })
    )
    .describe('One entry per memberId or email, in request order')
});

export const ZPublicApiAssignAudienceCoursesResponse = z.object({
  assigned: z.number(),
  alreadyEnrolled: z.number(),
  emailsSent: z.number()
});

export const ZPublicApiRemoveAudienceMemberResponse = z.object({
  id: z.number(),
  organizationId: z.string().uuid(),
  roleId: z.number().describe('1 = admin, 2 = tutor, 3 = student'),
  profileId: z.string().uuid().nullable(),
  email: z.string().nullable(),
  verified: z.boolean().nullable(),
  status: memberStatus,
  statusChangedAt: nullableTimestamp,
  statusChangedBy: z.string().uuid().nullable(),
  lastActiveAt: nullableTimestamp,
  createdAt: timestamp
});
