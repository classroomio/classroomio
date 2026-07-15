import { SvelteMap } from 'svelte/reactivity';
import type { AssetTranscriptPayload } from '$features/media/utils/types';

type SeekFn = (seconds: number) => void;

export type LessonTranscriptSource = {
  assetId: string;
  videoIndex: number;
  transcript: AssetTranscriptPayload | null;
  transcriptLoading: boolean;
  currentTimeSeconds: number;
  seek: SeekFn;
};

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

  private seekFn: SeekFn = () => {};

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

    this.transcriptSources.set(assetId, { ...existing, ...patch });

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
  }
}

export const lessonVideoBus = new LessonVideoBus();
