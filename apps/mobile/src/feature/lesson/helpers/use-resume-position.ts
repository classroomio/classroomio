import { useEventListener } from 'expo';
import Storage from 'expo-sqlite/kv-store';
import type { VideoPlayer } from 'expo-video';
import { useRef, useState } from 'react';

const STORAGE_PREFIX = 'video-resume:';
const MIN_RESUME_SECONDS = 5;
const END_MARGIN_SECONDS = 10;
const SAVE_EVERY_SECONDS = 5;

/**
 * Starts the video where the learner left it and reports that position for the "Resumed from" chip.
 * `serverResumeAt` is the position the watch policy already restores; otherwise the last position saved on the device is used.
 */
export function useResumePosition(player: VideoPlayer, key: string, serverResumeAt: number | null) {
  const storageKey = `${STORAGE_PREFIX}${key}`;
  const [resumedFrom, setResumedFrom] = useState<number | null>(null);
  const applied = useRef(false);
  const lastSaved = useRef(0);

  useEventListener(player, 'statusChange', ({ status }) => {
    if (status !== 'readyToPlay' || applied.current) return;

    applied.current = true;
    const saved = serverResumeAt ?? Number(Storage.getItemSync(storageKey) ?? 0);
    const duration = player.duration;
    if (!Number.isFinite(saved) || saved < MIN_RESUME_SECONDS) return;
    if (duration > 0 && saved > duration - END_MARGIN_SECONDS) return;

    if (serverResumeAt === null) player.currentTime = saved;
    setResumedFrom(saved);
  });

  useEventListener(player, 'timeUpdate', ({ currentTime }) => {
    if (!applied.current || Math.abs(currentTime - lastSaved.current) < SAVE_EVERY_SECONDS) return;

    lastSaved.current = currentTime;
    void Storage.setItemAsync(storageKey, String(Math.floor(currentTime))).catch(() => {});
  });

  useEventListener(player, 'playToEnd', () => {
    void Storage.removeItemAsync(storageKey).catch(() => {});
  });

  return { resumedFrom, clearResumed: () => setResumedFrom(null) };
}
