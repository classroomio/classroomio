function toMetadataObject(metadata: unknown): Record<string, unknown> | null {
  if (metadata == null) {
    return null;
  }
  if (typeof metadata === 'string') {
    try {
      const parsed = JSON.parse(metadata) as unknown;
      return typeof parsed === 'object' && parsed !== null ? (parsed as Record<string, unknown>) : null;
    } catch {
      return null;
    }
  }

  return typeof metadata === 'object' ? (metadata as Record<string, unknown>) : null;
}

function parseInviteIds(metadata: unknown, keys: string[]): string[] {
  const obj = toMetadataObject(metadata);
  if (!obj) {
    return [];
  }

  const raw = keys.map((key) => obj[key]).find((value) => value !== undefined);
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw.filter((id): id is string => typeof id === 'string' && id.length > 0);
}

/** Normalize JSONB organization-invite metadata for course ids (matches importAudienceMembers storage). */
export function parseCourseIdsFromInviteMetadata(metadata: unknown): string[] {
  return parseInviteIds(metadata, ['courseIds', 'course_ids']);
}

/** Normalize JSONB organization-invite metadata for cohort ids (legacy `programIds` supported). */
export function parseCohortIdsFromInviteMetadata(metadata: unknown): string[] {
  return parseInviteIds(metadata, ['cohortIds', 'cohort_ids', 'programIds', 'program_ids']);
}

/** The full name an admin entered for this person at import time, trimmed, or undefined when none was stored. */
export function parseFullnameFromInviteMetadata(metadata: unknown): string | undefined {
  const fullname = toMetadataObject(metadata)?.fullname;

  return typeof fullname === 'string' && fullname.trim() ? fullname.trim() : undefined;
}
