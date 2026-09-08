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
   *
   * Parsed explicitly rather than with `z.coerce.boolean()`, which turns the
   * non-empty string `"false"` into `true` — the query string always carries
   * strings, so coercion would make the override impossible to turn off and
   * silently narrow both the displayed and the acted-on set.
   */
  excludeRecentJoiners: z
    .union([z.boolean(), z.enum(['true', 'false'])])
    .default(true)
    .transform((value) => value === true || value === 'true')
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

/** Explicit tick-box selection is capped; past this the admin is in filter mode anyway. */
export const AUDIENCE_BULK_IDS_MAX = 500;

/**
 * Above this many resolved members the action is queued rather than run inside
 * the request. The threshold is checked against the *resolved* target, so
 * filter mode cannot slip past it by naming no ids.
 */
export const AUDIENCE_BULK_SYNC_MAX = 1000;

export const AudienceBulkAction = z.enum(['deactivate', 'reactivate', 'archive', 'unarchive', 'delete']);
export type TAudienceBulkAction = z.infer<typeof AudienceBulkAction>;

/**
 * Two selection modes, because tick-boxes do not scale to a filtered set of
 * several thousand learners.
 *
 * `filter` mode carries both an exact `expectedCount` and an
 * `expectedTargetHash` — a SHA-256 over the sorted member ids the admin was
 * actually shown. A matching count does not prove a matching target: if one
 * learner logs in and another goes dormant between preview and apply the count
 * is identical while the set is not, and the admin would silently act on
 * someone they never reviewed. The hash is what makes the guarantee real; the
 * count is what makes the error message readable.
 */
export const ZBulkAudienceTarget = z.discriminatedUnion('mode', [
  z.object({
    mode: z.literal('ids'),
    memberIds: z.array(z.number().int().positive()).min(1).max(AUDIENCE_BULK_IDS_MAX)
  }),
  z.object({
    mode: z.literal('filter'),
    filter: ZGetAudienceQuery.omit({ page: true, limit: true, sortBy: true, sortOrder: true }),
    expectedCount: z.number().int().positive(),
    expectedTargetHash: z.string().length(64)
  })
]);
export type TBulkAudienceTarget = z.infer<typeof ZBulkAudienceTarget>;

export const ZBulkAudienceAction = z.object({
  target: ZBulkAudienceTarget,
  action: AudienceBulkAction,
  reason: z.string().trim().max(500).optional()
});
export type TBulkAudienceAction = z.infer<typeof ZBulkAudienceAction>;

/** Undo acts on the ids that actually succeeded, never on a re-run of the filter. */
export const ZUndoBulkAudienceAction = z.object({
  undoToken: z.string().min(1).max(200)
});
export type TUndoBulkAudienceAction = z.infer<typeof ZUndoBulkAudienceAction>;

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
