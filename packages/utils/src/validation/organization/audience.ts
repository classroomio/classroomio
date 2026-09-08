import * as z from 'zod';

export const AudienceSortBy = z.enum(['createdAt', 'name', 'email', 'lastLoginAt', 'lastActiveAt']);
export const AudienceSortOrder = z.enum(['asc', 'desc']);

/** Lifecycle state of the membership. Mirrors the `ORGANIZATION_MEMBER_STATUS` enum. */
export const AudienceMemberStatus = z.enum(['ACTIVE', 'DEACTIVATED', 'ARCHIVED']);

/** Invite state, derived rather than stored. See `deriveAudienceMemberStatus`. */
export const AudienceInviteStatus = z.enum(['active', 'pending', 'expired', 'revoked']);

export const AudienceEnrollment = z.enum(['enrolled', 'not_enrolled']);

/** Exclusive by precedence, not three independent predicates. See `getOrganizationAudience`. */
export const AudienceCompletion = z.enum(['not_started', 'in_progress', 'completed']);

/**
 * Staleness thresholds, not recency windows: `90d` means "not seen in 90 days".
 * `never` means no such event was ever recorded.
 */
export const AudienceActivityWindow = z.enum(['7d', '30d', '90d', '180d', 'never']);

export const ZGetAudienceQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().optional(),
  sortBy: AudienceSortBy.default('createdAt'),
  sortOrder: AudienceSortOrder.default('desc'),
  // ACTIVE by default, so archived learners drop out unasked.
  status: AudienceMemberStatus.default('ACTIVE'),
  inviteStatus: AudienceInviteStatus.optional(),
  enrollment: AudienceEnrollment.optional(),
  completion: AudienceCompletion.optional(),
  lastLoginBefore: AudienceActivityWindow.optional(),
  lastActiveBefore: AudienceActivityWindow.optional(),
  /**
   * Keeps learners who joined inside the staleness window out of the results.
   *
   * Parsed explicitly because `z.coerce.boolean()` turns the string `"false"`
   * into `true`, which would make the override impossible to switch off.
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

/** Days behind each threshold. `never` is an absence, not a cutoff. */
export const AUDIENCE_ACTIVITY_WINDOW_DAYS: Record<Exclude<TAudienceActivityWindow, 'never'>, number> = {
  '7d': 7,
  '30d': 30,
  '90d': 90,
  '180d': 180
};

/** Cap on explicit tick-box selection. */
export const AUDIENCE_BULK_IDS_MAX = 500;

/** Checked against the *resolved* target, so filter mode cannot slip past it. */
export const AUDIENCE_BULK_SYNC_MAX = 1000;

export const AudienceBulkAction = z.enum(['deactivate', 'reactivate', 'archive', 'unarchive', 'delete']);
export type TAudienceBulkAction = z.infer<typeof AudienceBulkAction>;

/**
 * Two selection modes, because tick-boxes do not scale to thousands of rows.
 *
 * `filter` mode carries an exact count *and* a hash of the ids shown: a
 * matching count alone does not prove a matching target, since two learners
 * swapping states leaves the count identical and the set different.
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
