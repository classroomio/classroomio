import type { AssetTranscriptPayload } from '$features/media/utils/types';

type SeekFn = (seconds: number) => void;

class LessonVideoBus {
  /** Asset id of the currently mounted upload-video player (if any). */
  assetId = $state<string | null>(null);
  /** Last reported playback time in seconds. */
  currentTimeSeconds = $state(0);
  /** True after the user (or autoplay) has started playback at least once for the current asset. */
  hasPlayed = $state(false);
  /** Latest transcript payload for the active asset; null if none / still loading. */
  transcript = $state<AssetTranscriptPayload | null>(null);
  /** True while the transcript fetch is in flight. */
  transcriptLoading = $state(false);

  private seekFn: SeekFn = () => {};

  setSeekFn(seekFn: SeekFn) {
    this.seekFn = seekFn;
  }

  seek(seconds: number) {
    this.seekFn(seconds);
  }

  /** Replace the active transcript (e.g. after an edit is saved). */
  setTranscript(transcript: AssetTranscriptPayload | null) {
    this.transcript = transcript;
  }

  /** Reset all per-lesson state (called when the upload asset changes or the player unmounts). */
  reset(opts?: { keepAssetId?: boolean }) {
    if (!opts?.keepAssetId) {
      this.assetId = null;
    }

    this.currentTimeSeconds = 0;
    this.hasPlayed = false;
    this.transcript = null;
    this.transcriptLoading = false;
    this.seekFn = () => {};
  }
}

export const lessonVideoBus = new LessonVideoBus();
