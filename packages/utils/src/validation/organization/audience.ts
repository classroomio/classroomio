import * as z from 'zod';

export const AudienceSortBy = z.enum(['createdAt', 'name', 'email', 'lastLoginAt', 'lastActiveAt']);
export const AudienceSortOrder = z.enum(['asc', 'desc']);

/** Lifecycle state of the membership. Mirrors the `ORGANIZATION_MEMBER_STATUS` enum. */
export const AudienceMemberStatus = z.enum(['ACTIVE', 'DEACTIVATED', 'ARCHIVED']);

/** Invite state, derived rather than stored. See `deriveAudienceMemberStatus`. */
export const AudienceInviteStatus = z.enum(['active', 'pending', 'expired', 'revoked']);

export const AudienceEnrollment = z.enum(['enrolled', 'not_enrolled']);

/**
 * Learner-level completion state. Exclusive by precedence rather than three
 * independent predicates — see `getOrganizationAudience`, which encodes the
 * same precedence in one SQL CASE so the buckets provably partition the
 * enrolled population.
 */
export const AudienceCompletion = z.enum(['not_started', 'in_progress', 'completed']);

/**
 * Staleness thresholds, not recency windows: `90d` means "hasn't been seen in
 * 90 days". The polarity matters — an admin hunting dormant learners thinks in
 * "hasn't logged in for 90 days", and getting it right here keeps it right in
 * the UI. `never` means no event of that kind has ever been recorded.
 */
export const AudienceActivityWindow = z.enum(['7d', '30d', '90d', '180d', 'never']);

export const ZGetAudienceQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().optional(),
  sortBy: AudienceSortBy.default('createdAt'),
  sortOrder: AudienceSortOrder.default('desc'),
  // Defaults to ACTIVE server-side so archived learners drop out of the
  // default view without the caller having to ask.
  status: AudienceMemberStatus.default('ACTIVE'),
  inviteStatus: AudienceInviteStatus.optional(),
  enrollment: AudienceEnrollment.optional(),
  completion: AudienceCompletion.optional(),
  lastLoginBefore: AudienceActivityWindow.optional(),
  lastActiveBefore: AudienceActivityWindow.optional(),
  /**
   * Excludes learners who joined inside the staleness window from
   * `lastLoginBefore` / `lastActiveBefore` results, so "never logged in" cannot
   * silently sweep up people invited last week.
   */
  excludeRecentJoiners: z.coerce.boolean().default(true)
});

export type TAudienceSortBy = z.infer<typeof AudienceSortBy>;
export type TAudienceSortOrder = z.infer<typeof AudienceSortOrder>;
export type TAudienceMemberStatus = z.infer<typeof AudienceMemberStatus>;
export type TAudienceInviteStatus = z.infer<typeof AudienceInviteStatus>;
export type TAudienceEnrollment = z.infer<typeof AudienceEnrollment>;
export type TAudienceCompletion = z.infer<typeof AudienceCompletion>;
export type TAudienceActivityWindow = z.infer<typeof AudienceActivityWindow>;
export type TGetAudienceQuery = z.infer<typeof ZGetAudienceQuery>;

/** Days behind each staleness threshold. `never` is handled separately — it is an absence, not a cutoff. */
export const AUDIENCE_ACTIVITY_WINDOW_DAYS: Record<Exclude<TAudienceActivityWindow, 'never'>, number> = {
  '7d': 7,
  '30d': 30,
  '90d': 90,
  '180d': 180
};

export const ZImportAudienceMembers = z.object({
  recipientCsv: z.string().max(25000),
  courseIds: z.array(z.string().uuid()).optional(),
  cohortIds: z.array(z.string().uuid()).optional(),
  allCourses: z.boolean().optional().default(false),
  allCohorts: z.boolean().optional().default(false),
  sendEmail: z.boolean().default(true)
});

export type TImportAudienceMembers = z.infer<typeof ZImportAudienceMembers>;

export const ZAssignAudienceCourses = z
  .object({
    profileIds: z.array(z.uuid()).min(1).max(500),
    courseIds: z.array(z.uuid()).optional(),
    cohortIds: z.array(z.uuid()).optional(),
    sendEmail: z.boolean().default(true)
  })
  .refine((data) => (data.courseIds?.length ?? 0) > 0 || (data.cohortIds?.length ?? 0) > 0, {
    message: 'At least one course or cohort must be selected',
    path: ['courseIds']
  });

export type TAssignAudienceCourses = z.infer<typeof ZAssignAudienceCourses>;

export const ZAudienceInviteByEmail = z.object({
  email: z.email()
});

export type TAudienceInviteByEmail = z.infer<typeof ZAudienceInviteByEmail>;
