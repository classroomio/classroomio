import { getAssetsByIds } from '@cio/db/queries/assets';
import { getLessonById } from '@cio/db/queries/lesson';
import { AppError, ErrorCodes } from '@api/utils/errors';

export type LessonVideoHlsStatus = 'none' | 'pending' | 'converting' | 'ready' | 'failed' | 'skipped';

/**
 * Encoding state of a lesson's uploaded videos, keyed by asset id.
 *
 * Served separately from the lesson rather than folded into `videos[]`, for two
 * reasons: the editor writes that array back on save, so a status copied into it
 * would be frozen at whatever it was when the page loaded; and a caller polling
 * for `ready` must not refetch the whole lesson underneath someone's unsaved
 * edits.
 */
export async function getLessonVideoHlsStatusesService(
  lessonId: string
): Promise<Record<string, LessonVideoHlsStatus>> {
  const lesson = await getLessonById(lessonId);
  if (!lesson) {
    throw new AppError('Lesson not found', ErrorCodes.LESSON_NOT_FOUND, 404);
  }

  const videos = lesson.videos ?? [];
  const assetIds = videos
    .filter((video) => video.type === 'upload')
    .map((video) => video.assetId)
    .filter((assetId): assetId is string => Boolean(assetId));

  if (assetIds.length === 0) {
    return {};
  }

  const assets = await getAssetsByIds(assetIds);
  const statuses: Record<string, LessonVideoHlsStatus> = {};

  for (const asset of assets) {
    statuses[asset.id] = (asset.hlsStatus ?? 'none') as LessonVideoHlsStatus;
  }

  return statuses;
}
