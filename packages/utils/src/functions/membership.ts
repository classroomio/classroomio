/**
 * Builds the composite key identifying one profile's membership in one scope
 * (course group, cohort, or learning path).
 *
 * The bulk-enrollment existence helpers (`getExistingGroupMembers`,
 * `getExistingCohortMembers`, `getExistingPathMembers`) and every caller that
 * probes the returned set must construct this key identically on both sides.
 * A format drift silently breaks the skip-if-enrolled check, causing duplicate
 * inserts or wrong already-enrolled counts — so build it here, not inline.
 *
 * @param scopeId Scope the membership belongs to (group, cohort, or path id)
 * @param profileId Profile holding the membership
 * @returns Composite key in `{scopeId}:{profileId}` form
 */
export function membershipKey(scopeId: string, profileId: string): string {
  return `${scopeId}:${profileId}`;
}
