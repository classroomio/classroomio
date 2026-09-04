import { SvelteMap } from 'svelte/reactivity';
import type { AssetTranscriptPayload } from '$features/media/utils/types';

const AUTOPLAY_STORAGE_KEY = 'classroomio:autoplay';

type SeekFn = (seconds: number) => void;
type PlaybackResult = 'played' | 'blocked' | 'not-ready' | 'error';
type PlayWhenReady = () => Promise<PlaybackResult>;

export type LessonTranscriptSource = {
  assetId: string;
  videoIndex: number;
  transcript: AssetTranscriptPayload | null;
  transcriptLoading: boolean;
  currentTimeSeconds: number;
  seek: SeekFn;
};

function loadAutoplayPreference(): boolean {
  if (typeof localStorage === 'undefined') return true;
  const stored = localStorage.getItem(AUTOPLAY_STORAGE_KEY);
  if (stored === null) return true;
  return stored !== 'false';
}

class LessonVideoBus {
  /** Asset id of the currently mounted upload-video player (if any). */
  assetId = $state<string | null>(null);
  /** Last reported playback time in seconds for the active player asset. */
  currentTimeSeconds = $state(0);
  /** True after the user (or autoplay) has started playback at least once for the current asset. */
  hasPlayed = $state(false);
  /** Latest transcript payload for the active transcript source. */
  transcript = $state<AssetTranscriptPayload | null>(null);
  /** True while the active transcript fetch is in flight. */
  transcriptLoading = $state(false);
  /** Transcript sources keyed by upload asset id. */
  transcriptSources = new SvelteMap<string, LessonTranscriptSource>();
  /** Which upload asset transcript is shown in the side panel. */
  activeTranscriptAssetId = $state<string | null>(null);

  /** Whether autoplay is enabled (persisted to localStorage). */
  autoplayEnabled = $state(loadAutoplayPreference());
  /** Set to true when the last video in the lesson ends and autoplay is on. */
  lastVideoEnded = $state(false);
  /**
   * Index of the video that autoplay tried to start but couldn't (browser
   * policy / not-ready). `null` when there is no video waiting on a user
   * gesture. Drives the in-player "Play next" affordance.
   */
  pendingAutoplayIndex = $state<number | null>(null);

  private seekFn: SeekFn = () => {};
  private players = new Map<number, PlayWhenReady>();

  setSeekFn(seekFn: SeekFn) {
    this.seekFn = seekFn;
  }

  seek(seconds: number) {
    const activeSource = this.getActiveTranscriptSource();

    if (activeSource) {
      activeSource.seek(seconds);
      return;
    }

    this.seekFn(seconds);
  }

  registerPlayer(index: number, playWhenReady: PlayWhenReady) {
    this.players.set(index, playWhenReady);
  }

  unregisterPlayer(index: number) {
    this.players.delete(index);
    if (this.pendingAutoplayIndex === index) {
      this.pendingAutoplayIndex = null;
    }
  }

  toggleAutoplay() {
    this.autoplayEnabled = !this.autoplayEnabled;
    try {
      localStorage.setItem(AUTOPLAY_STORAGE_KEY, String(this.autoplayEnabled));
    } catch {
      // localStorage may be unavailable in private browsing or storage-full scenarios.
    }
  }

  /**
   * Called when a video ends. If autoplay is enabled and there is a next
   * video, it starts playing it. If this was the last video, sets
   * `lastVideoEnded` so the parent can show the "Up Next" overlay. When the
   * next video can't start automatically (browser policy / not ready), sets
   * `pendingAutoplayIndex` so the parent can show an in-player play button.
   */
  async playNextVideo(currentIndex: number) {
    const nextIndex = currentIndex + 1;
    const nextPlayWhenReady = this.players.get(nextIndex);

    if (!nextPlayWhenReady) {
      this.lastVideoEnded = true;
      this.pendingAutoplayIndex = null;
      return;
    }

    this.lastVideoEnded = false;
    this.pendingAutoplayIndex = null;

    if (typeof document !== 'undefined') {
      const nextEl = document.querySelector<HTMLElement>(`[data-video-index="${nextIndex}"]`);
      nextEl?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    const result = await nextPlayWhenReady();

    if (result === 'played') {
      return;
    }

    // Autoplay failed (policy, not ready, error) → defer to a user gesture.
    this.pendingAutoplayIndex = nextIndex;
  }

  /** Clear the "waiting on a user gesture" state for a blocked video. */
  clearPendingAutoplay() {
    this.pendingAutoplayIndex = null;
  }

  /**
   * Start the pending (blocked) video from a user gesture. Clears the
   * pending state and calls the player's `playWhenReady()` under the real
   * gesture so the browser permits playback.
   */
  async playPendingNow() {
    const index = this.pendingAutoplayIndex;
    this.pendingAutoplayIndex = null;

    if (index === null) return;

    const playWhenReady = this.players.get(index);
    if (playWhenReady) {
      const result = await playWhenReady();
      if (result === 'played') {
        this.hasPlayed = true;
      }
    }
  }

  cancelLastVideoEnded() {
    this.lastVideoEnded = false;
  }

  registerTranscriptSource(source: LessonTranscriptSource) {
    this.transcriptSources.set(source.assetId, source);
  }

  unregisterTranscriptSource(assetId: string) {
    this.transcriptSources.delete(assetId);

    if (this.activeTranscriptAssetId === assetId) {
      const nextSource = this.getNavigableTranscriptSources()[0] ?? null;
      this.activeTranscriptAssetId = nextSource?.assetId ?? null;
      this.syncActiveTranscriptToLegacyFields();
    }
  }

  updateTranscriptSource(assetId: string, patch: Partial<LessonTranscriptSource>) {
    const existing = this.transcriptSources.get(assetId);

    if (!existing) return;

    let next = existing;
    let changed = false;

    for (const key of Object.keys(patch) as (keyof LessonTranscriptSource)[]) {
      const value = patch[key];

      if (value !== undefined && existing[key] !== value) {
        if (!changed) {
          next = { ...existing };
          changed = true;
        }

        next = { ...next, [key]: value };
      }
    }

    if (!changed) return;

    this.transcriptSources.set(assetId, next);

    if (this.activeTranscriptAssetId === assetId) {
      this.syncActiveTranscriptToLegacyFields();
    }
  }

  getActiveTranscriptSource(): LessonTranscriptSource | null {
    const assetId = this.activeTranscriptAssetId;

    if (!assetId) return null;

    return this.transcriptSources.get(assetId) ?? null;
  }

  getNavigableTranscriptSources(): LessonTranscriptSource[] {
    return [...this.transcriptSources.values()]
      .filter((source) => (source.transcript?.segments?.length ?? 0) > 0)
      .sort((left, right) => left.videoIndex - right.videoIndex);
  }

  hasTranscriptAvailable(): boolean {
    return [...this.transcriptSources.values()].some((source) => source.transcript != null);
  }

  selectTranscriptSource(assetId: string) {
    if (!this.transcriptSources.has(assetId)) return;

    this.activeTranscriptAssetId = assetId;
    this.syncActiveTranscriptToLegacyFields();
  }

  prepareTranscriptPanelSelection() {
    const navigableSources = this.getNavigableTranscriptSources();

    if (navigableSources.length === 0) {
      const fallbackSource = [...this.transcriptSources.values()]
        .filter((source) => source.transcript || source.transcriptLoading)
        .sort((left, right) => left.videoIndex - right.videoIndex)[0];

      if (!fallbackSource) return false;

      this.selectTranscriptSource(fallbackSource.assetId);
      return true;
    }

    const currentAssetId = this.activeTranscriptAssetId;
    const hasCurrent = currentAssetId != null && navigableSources.some((source) => source.assetId === currentAssetId);

    if (!hasCurrent) {
      this.selectTranscriptSource(navigableSources[0].assetId);
    }

    return true;
  }

  /** Replace the active transcript (e.g. after an edit is saved). */
  setTranscript(transcript: AssetTranscriptPayload | null) {
    const assetId = this.activeTranscriptAssetId;

    if (assetId) {
      this.updateTranscriptSource(assetId, { transcript });
      return;
    }

    this.transcript = transcript;
  }

  private syncActiveTranscriptToLegacyFields() {
    const source = this.getActiveTranscriptSource();

    if (!source) {
      this.transcript = null;
      this.transcriptLoading = false;
      return;
    }

    this.assetId = source.assetId;
    this.transcript = source.transcript;
    this.transcriptLoading = source.transcriptLoading;
    this.seekFn = source.seek;
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
    this.activeTranscriptAssetId = null;
    this.transcriptSources.clear();
    this.seekFn = () => {};
    this.lastVideoEnded = false;
    this.pendingAutoplayIndex = null;
    // Note: the player registry is intentionally NOT cleared here. Each
    // player unregisters itself in its own onDestroy; clearing the registry
    // globally could wipe remaining players (e.g. a YouTube link that
    // registered no transcript source) while they are still mounted.
  }
}

export const lessonVideoBus = new LessonVideoBus();
