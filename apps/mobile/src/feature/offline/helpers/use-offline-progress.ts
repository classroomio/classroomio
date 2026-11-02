import { onlineManager } from '@tanstack/react-query';

import { useAuth } from '@/feature/auth/components/auth-provider';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';
import { isNetworkError } from '@/feature/offline/helpers/network-error';
import { queueLessonCompletion, queuePlaybackPosition } from '@/feature/offline/helpers/sync-queue';
import { requestSync } from '@/feature/offline/helpers/sync-runner';
import { offlineCatalog } from '@/feature/offline/translations/catalog';
import { useActiveOrgId } from '@/feature/org/helpers/active-org-store';

type LessonRef = { courseId: string; lessonId: string; lessonTitle?: string | null; courseTitle?: string | null };

type Beat = { assetId: string; positionSeconds: number; playedDeltaSeconds: number; durationSeconds: number };

function useLessonIntentBase({ courseId, lessonId, lessonTitle, courseTitle }: LessonRef) {
  const { userId } = useAuth();
  const orgId = useActiveOrgId();

  return userId && orgId
    ? { userId, orgId, courseId, lessonId, lessonTitle: lessonTitle ?? null, courseTitle: courseTitle ?? null }
    : null;
}

export function useQueueLessonCompletion(lesson: LessonRef) {
  const base = useLessonIntentBase(lesson);
  const t = useTranslations(offlineCatalog);

  return async () => {
    if (!base) throw new Error(t('signInToSave'));

    await queueLessonCompletion(base);
    void requestSync();
  };
}

/**
 * Sends a watch heartbeat online; offline, or when the request cannot reach the server, saves it on the device
 * instead. Resolves with the server's answer, or null when the beat was saved for later.
 */
export function useOfflineAwareWatchReport<Result>(lesson: LessonRef, report: (beat: Beat) => Promise<Result>) {
  const base = useLessonIntentBase(lesson);

  const save = async (beat: Beat) => {
    if (base) await queuePlaybackPosition({ ...base, ...beat });

    return null;
  };

  return async (beat: Beat): Promise<Result | null> => {
    if (!onlineManager.isOnline()) return save(beat);

    try {
      return await report(beat);
    } catch (error) {
      if (isNetworkError(error)) return save(beat);

      throw error;
    }
  };
}
