export type HlsEncodeStage = 'probing' | 'encoding' | 'uploading' | 'thumbnail' | 'finalizing' | 'done' | 'failed';

export interface HlsRungConfig {
  name: string;
  width: number;
  height: number;
  videoBitrate: number;
}

export interface HlsUploadFailureContext {
  objectPath: string;
  requestBytes: number;
  contentType: string;
  attempt: number;
  requestDurationMs: number;
  presignedAgeMs: number;
  httpStatus: number | null;
  errorName?: string;
}

export interface HlsUploadDiagnosticContext {
  assetId: string | null;
  stage: HlsEncodeStage;
  source: {
    fileSizeBytes: number;
    mimeType: string | null;
    durationSeconds: number | null;
    width: number | null;
    height: number | null;
    hasAudio: boolean | null;
  };
  encoding: {
    renditions: HlsRungConfig[];
    outputVideoCodec: 'avc';
    outputAudioCodec: 'aac' | 'none';
  };
  progress: {
    uploadedBytes: number;
    uploadedCount: number;
    expectedUploadBytes: number | null;
  };
  failedRequest: HlsUploadFailureContext | null;
}
