function toMetadataObject(metadata: unknown): Record<string, unknown> | null {
  if (metadata == null) return null;
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
  if (!obj) return [];
  const raw = keys.map((key) => obj[key]).find((value) => value !== undefined);
  if (!Array.isArray(raw)) return [];
  return raw.filter((id): id is string => typeof id === 'string' && id.length > 0);
}

/** Normalize JSONB organization-invite metadata for course ids. */
export function parseCourseIdsFromInviteMetadata(metadata: unknown): string[] {
  return parseInviteIds(metadata, ['courseIds', 'course_ids']);
}

/** Normalize JSONB organization-invite metadata for cohort ids (legacy `programIds` supported). */
export function parseCohortIdsFromInviteMetadata(metadata: unknown): string[] {
  return parseInviteIds(metadata, ['cohortIds', 'cohort_ids', 'programIds', 'program_ids']);
}

/** Normalize JSONB organization-invite metadata for learning-path ids (accepted but unused on main). */
export function parsePathIdsFromInviteMetadata(metadata: unknown): string[] {
  return parseInviteIds(metadata, ['pathIds', 'path_ids', 'learningPathIds', 'learning_path_ids']);
}

/** Merge id lists, preserving first-seen order and dropping blanks. */
export function mergeInviteIdLists(...lists: string[][]): string[] {
  const seen = new Set<string>();
  const merged: string[] = [];
  for (const list of lists) {
    for (const id of list) {
      if (typeof id !== 'string' || id.length === 0 || seen.has(id)) continue;
      seen.add(id);
      merged.push(id);
    }
  }
  return merged;
}

export type TInvitedPersonStatus = 'pending' | 'expired';

/** Status of a not-yet-accepted invite: `expired` once its expiry has passed, otherwise `pending` (no expiry = pending). */
export function getInvitedPersonStatus(expiresAt: string | null, now: number = Date.now()): TInvitedPersonStatus {
  if (!expiresAt) return 'pending';

  return new Date(expiresAt).getTime() <= now ? 'expired' : 'pending';
}
