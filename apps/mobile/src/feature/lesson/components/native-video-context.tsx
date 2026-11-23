import type { SubtitleTrack, VideoPlayer } from 'expo-video';
import { createContext, use } from 'react';

import type { TranscriptSegment } from '@/feature/lesson/types/lesson';

export type CaptionChoice = { kind: 'off' } | { kind: 'track'; track: SubtitleTrack } | { kind: 'transcript' };

type NativeVideoContextValue = {
  player: VideoPlayer;
  enforced: boolean;
  segments: TranscriptSegment[];
  captions: CaptionChoice;
  setCaptions: (choice: CaptionChoice) => void;
  subtitleTracks: SubtitleTrack[];
  /** Playing a downloaded file, so streaming quality does not apply. */
  local: boolean;
  /** Where playback resumed, in seconds, until the chip saying so is dismissed. */
  resumedFrom: number | null;
  clearResumed: () => void;
  onRetry: () => void;
};

export const NativeVideoContext = createContext<NativeVideoContextValue | null>(null);

export function useNativeVideo() {
  const context = use(NativeVideoContext);
  if (!context) throw new Error('NativeVideo parts must be used inside NativeVideo');

  return context;
}
