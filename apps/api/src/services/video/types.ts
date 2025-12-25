export interface VideoEncodingJob {
  fileKey: string;
  userId: string;
  lessonId?: string;
  language?: string;
  migrateFromMuse?: boolean;
}

export interface CaptionOptions {
  language?: string; // 'en', 'es', 'fr', etc. Auto-detect if not provided
  model?: 'tiny' | 'base' | 'small' | 'medium' | 'large';
}

export interface CaptionResult {
  srtContent: string;
  vttContent: string;
  transcript: string;
  language: string;
  duration: number;
}

export interface HLSEncodingResult {
  manifestUrl: string;
  qualities: string[];
  segments: string[];
}

export interface VideoProcessingResult {
  manifestUrl: string;
  captions: {
    srtUrl: string;
    vttUrl: string;
    transcript: string;
    language: string;
  };
  qualities: string[];
  duration: number;
}
