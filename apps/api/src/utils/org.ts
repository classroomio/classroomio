/** Normalize JSONB organization-invite metadata for course ids (matches importAudienceMembers storage). */
export function parseCourseIdsFromInviteMetadata(metadata: unknown): string[] {
  let obj: Record<string, unknown> | null = null;
  if (metadata == null) {
    return [];
  }
  if (typeof metadata === 'string') {
    try {
      const parsed = JSON.parse(metadata) as unknown;
      obj = typeof parsed === 'object' && parsed !== null ? (parsed as Record<string, unknown>) : null;
    } catch {
      return [];
    }
  } else if (typeof metadata === 'object') {
    obj = metadata as Record<string, unknown>;
  }
  if (!obj) {
    return [];
  }
  const raw = obj.courseIds ?? obj.course_ids;
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw.filter((id): id is string => typeof id === 'string' && id.length > 0);
}
