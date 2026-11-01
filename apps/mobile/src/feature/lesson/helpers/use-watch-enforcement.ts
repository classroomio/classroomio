import { useEventListener } from 'expo';
import type { VideoPlayer } from 'expo-video';
import { useEffect, useRef } from 'react';

import { successHaptic } from '@/feature/common/helpers/haptics';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';
import { useInvalidateProgress, useReportWatchProgress } from '@/feature/lesson/api/lesson';
import { lessonCatalog } from '@/feature/lesson/translations/catalog';
import type { LessonWatchProgress } from '@/feature/lesson/types/lesson';
import { useOfflineAwareWatchReport } from '@/feature/offline/helpers/use-offline-progress';
import { showToast } from '@/feature/toast/helpers/toast-store';

const HEARTBEAT_MS = 15_000;
const SEEK_TOLERANCE_SECONDS = 2;

type WatchEnforcementOptions = {
  courseId: string;
  lessonId: string;
  assetId: string | null;
  /** The server's watch progress for this lesson; enforcement applies when it lists `assetId`. */
  watchProgress: LessonWatchProgress | null | undefined;
  lessonTitle?: string | null;
  courseTitle?: string | null;
};

/**
 * Applies the lesson's `video_watch` completion policy to a native player the way the web player does:
 * normal speed only, no skipping past the furthest point watched, and a progress heartbeat every 15 seconds,
 * on pause and at the end. The API decides completion from those heartbeats; offline they wait in the sync queue.
 */
export function useWatchEnforcement(
  player: VideoPlayer,
  { courseId, lessonId, assetId, watchProgress, lessonTitle, courseTitle }: WatchEnforcementOptions
) {
  const t = useTranslations(lessonCatalog);
  const report = useOfflineAwareWatchReport(
    { courseId, lessonId, lessonTitle, courseTitle },
    useReportWatchProgress(courseId, lessonId)
  );
  const invalidate = useInvalidateProgress();
  const asset = assetId ? watchProgress?.assets.find((entry) => entry.assetId === assetId) : undefined;
  const enforced = Boolean(asset) && !asset?.isComplete;

  const furthest = useRef(asset?.furthestSeconds ?? 0);
  const played = useRef(0);
  const lastTime = useRef(0);
  const lastBeat = useRef(0);
  const restored = useRef(false);
  const correcting = useRef(false);

  const flush = (force: boolean) => {
    if (!enforced || !assetId) return;

    const duration = player.duration;
    const now = Date.now();
    if (!duration || !Number.isFinite(duration) || (!force && now - lastBeat.current < HEARTBEAT_MS)) return;
    if (played.current <= 0 && !force) return;

    lastBeat.current = now;
    const playedDeltaSeconds = played.current;
    played.current = 0;

    void report({ assetId, positionSeconds: player.currentTime, playedDeltaSeconds, durationSeconds: duration })
      .then((result) => {
        if (!result?.didJustComplete) return;

        successHaptic();
        showToast({ tone: 'success', title: t('lessonComplete'), description: t('watchedEnoughDescription') });
        void invalidate();
      })
      .catch(() => {});
  };

  useEffect(() => {
    if (!enforced) return;

    player.playbackRate = 1;
    if (!restored.current && asset && asset.lastPositionSeconds > 0) {
      restored.current = true;
      lastTime.current = asset.lastPositionSeconds;
      player.currentTime = asset.lastPositionSeconds;
    }
  }, [enforced, player, asset]);

  useEventListener(player, 'timeUpdate', ({ currentTime }) => {
    if (!enforced) return;

    if (currentTime > furthest.current + SEEK_TOLERANCE_SECONDS && !correcting.current) {
      correcting.current = true;
      player.currentTime = furthest.current;
      showToast({ tone: 'info', title: t('watchToMoveAhead'), description: t('watchToMoveAheadDescription') });
      return;
    }

    correcting.current = false;
    const delta = currentTime - lastTime.current;
    if (delta > 0 && delta < 2) {
      played.current += delta;
      furthest.current = Math.max(furthest.current, currentTime);
    }
    lastTime.current = currentTime;
    flush(false);
  });

  useEventListener(player, 'playbackRateChange', ({ playbackRate }) => {
    if (enforced && playbackRate !== 1) player.playbackRate = 1;
  });

  useEventListener(player, 'playingChange', ({ isPlaying }) => {
    if (!isPlaying) flush(true);
  });

  useEventListener(player, 'playToEnd', () => {
    if (!enforced) return;

    const tail = player.duration - lastTime.current;
    if (tail > 0 && tail < 2) played.current += tail;
    furthest.current = Math.max(furthest.current, player.duration);
    flush(true);
  });

  return { enforced, watchedPercent: asset?.watchedPercent ?? null };
}
