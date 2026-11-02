import * as SecureStore from 'expo-secure-store';
import { useSyncExternalStore } from 'react';

import { VIDEO_QUALITY_OPTIONS, VIDEO_QUALITY_STORAGE_KEY } from '@/feature/settings/constants/settings';
import type { VideoQuality } from '@/feature/settings/types/settings';

function parse(value: string | null): VideoQuality {
  return VIDEO_QUALITY_OPTIONS.find((option) => option.value === value)?.value ?? 'auto';
}

let quality = parse(SecureStore.getItem(VIDEO_QUALITY_STORAGE_KEY));

const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

export function getVideoQuality() {
  return quality;
}

export function setVideoQuality(next: VideoQuality) {
  quality = next;
  SecureStore.setItem(VIDEO_QUALITY_STORAGE_KEY, next);
  listeners.forEach((listener) => listener());
}

export function useVideoQuality() {
  return useSyncExternalStore(subscribe, getVideoQuality);
}

/** The resolution cap for streamed video at a quality setting, in the shape `VideoPlayer.maxResolution` takes. */
export function maxResolutionOf(value: VideoQuality) {
  return VIDEO_QUALITY_OPTIONS.find((option) => option.value === value)?.maxResolution ?? null;
}
