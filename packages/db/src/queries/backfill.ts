/**
 * Normalizes an optional organization id for backfill scoping.
 * Trims whitespace and maps empty or missing values to undefined so callers
 * can conditionally apply the org filter.
 */
export function normalizeBackfillOrgId(organizationId?: string): string | undefined {
  const trimmedOrgId = organizationId?.trim();

  return trimmedOrgId ? trimmedOrgId : undefined;
}
