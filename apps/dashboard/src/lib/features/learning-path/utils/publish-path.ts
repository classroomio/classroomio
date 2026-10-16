import { learningPathApi } from '../api';
import { generatePathSlug } from './path-slug';
import type { LearningPathDetail } from './types';

export type PublishPathResult = { ok: true; slug: string } | { ok: false; reason: 'failed' };

/**
 * Publishes a learning path, minting a public slug first when the path
 * doesn't have one yet. Mirrors `publishCourse` for courses: a newly
 * created path starts with `slug: null`, so publishing straight from the
 * "View Path site" modal must not persist `isPublished: true` without one.
 */
export async function publishPath(path: LearningPathDetail | null | undefined): Promise<PublishPathResult> {
  if (!path?.id) {
    return { ok: false, reason: 'failed' };
  }

  const trimmedSlug = path.slug?.trim();
  const slug = trimmedSlug ? trimmedSlug : generatePathSlug(path.name);
  const pathPublicId = path.publicId ?? path.id;

  const updated = await learningPathApi.update(pathPublicId, { isPublished: true, slug }, { showSuccessToast: false });

  if (!updated) {
    return { ok: false, reason: 'failed' };
  }

  const publishedSlug = updated.slug ?? slug;

  return { ok: true, slug: publishedSlug };
}
