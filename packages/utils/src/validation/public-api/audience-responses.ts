import * as z from 'zod';

// Response shapes for OpenAPI docs only; handlers don't validate against them. Timestamps are Postgres text, not strict ISO.
const timestamp = z.string();
const nullableTimestamp = z.string().nullable();

const memberStatus = z.enum(['ACTIVE', 'DEACTIVATED', 'ARCHIVED']);

export const ZPublicApiAudienceMemberResponse = z.object({
  id: z.number(),
  profileId: z.string().uuid().nullable().describe('null until the invited person creates an account'),
  name: z.string(),
  email: z.string(),
  avatarUrl: z.string(),
  createdAt: z.string().describe('Day the member joined this organization, as a date string (e.g. "Mon Oct 05 2026")'),
  status: z.enum(['active', 'pending', 'expired', 'revoked']).describe('Invite state'),
  memberStatus: memberStatus.describe('Lifecycle state of the membership'),
  lastLoginAt: nullableTimestamp,
  lastActiveAt: nullableTimestamp,
  enrolledCount: z.number(),
  completedCount: z.number(),
  progressPercent: z.number()
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
  assigned: z.number(),
  alreadyEnrolledInCourses: z.number(),
  alreadyEnrolledInCohorts: z.number(),
  pendingInvitesRenewed: z.number(),
  truncated: z.number().describe('Rows beyond the import limit, which were not processed')
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
