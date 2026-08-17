export type YoutubeCaptionProvider = 'supadata' | 'manual' | 'unavailable';

export interface YoutubeCaptionFetchResult {
  youtubeVideoId: string;
  language: string;
  isGenerated: boolean;
  text: string;
  segments: Array<{ start: number; end: number; text: string }>;
  provider: YoutubeCaptionProvider;
  sourceTrackKind: 'manual' | 'asr' | 'unknown';
}

export interface YoutubeCaptionAdapter {
  fetchNativeCaptions(input: {
    youtubeVideoId: string;
    canonicalUrl: string;
    preferredLanguages: string[];
  }): Promise<YoutubeCaptionFetchResult | { unavailable: true; reason: string }>;
}
