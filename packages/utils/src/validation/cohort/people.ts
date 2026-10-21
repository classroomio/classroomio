import * as z from 'zod';

export const ZCohortPeopleParam = z.object({
  cohortId: z.string().uuid()
});
export type TCohortPeopleParam = z.infer<typeof ZCohortPeopleParam>;

export const CohortPeopleSortBy = z.enum(['name', 'role', 'joined', 'lastLogin']);
export type TCohortPeopleSortBy = z.infer<typeof CohortPeopleSortBy>;

export const CohortPeopleSortOrder = z.enum(['asc', 'desc']);
export type TCohortPeopleSortOrder = z.infer<typeof CohortPeopleSortOrder>;

/** A member with no profile is an invite that has not been accepted. */
export const CohortPeopleMembership = z.enum(['joined', 'invited']);
export type TCohortPeopleMembership = z.infer<typeof CohortPeopleMembership>;

/**
 * Staleness thresholds, not recency windows: `90d` means "not logged in for 90
 * days or more", `never` means no login event was ever recorded.
 */
export const CohortPeopleActivityWindow = z.enum(['7d', '30d', '90d', '180d', 'never']);
export type TCohortPeopleActivityWindow = z.infer<typeof CohortPeopleActivityWindow>;

export const COHORT_PEOPLE_WINDOW_DAYS: Record<Exclude<TCohortPeopleActivityWindow, 'never'>, number> = {
  '7d': 7,
  '30d': 30,
  '90d': 90,
  '180d': 180
};

export const ZCohortPeopleQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(200).optional(),
  roleId: z.coerce.number().int().min(1).optional(),
  sortBy: CohortPeopleSortBy.default('name'),
  sortOrder: CohortPeopleSortOrder.default('asc'),
  membership: CohortPeopleMembership.optional(),
  lastLoginBefore: CohortPeopleActivityWindow.optional()
});
export type TCohortPeopleQuery = z.infer<typeof ZCohortPeopleQuery>;
