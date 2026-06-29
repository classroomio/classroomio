const BYTES_PER_MB = 1024 * 1024;

function parseUploadLimitMb(value: string | undefined, defaultMb: number): number {
  if (value === undefined || value === '') {
    return defaultMb;
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return defaultMb;
  }

  return parsed;
}

export type UploadLimits = {
  documentMb: number;
  imageMb: number;
  videoMb: number;
  exerciseFileMb: number;
  agentDocumentMb: number;
  landingImageMb: number;
  thumbnailMb: number;
  documentBytes: number;
  imageBytes: number;
  videoBytes: number;
  exerciseFileBytes: number;
  agentDocumentBytes: number;
  landingImageBytes: number;
  thumbnailBytes: number;
};

export type UploadLimitEnv = {
  UPLOAD_MAX_DOCUMENT_MB?: string;
  UPLOAD_MAX_IMAGE_MB?: string;
  UPLOAD_MAX_VIDEO_MB?: string;
  UPLOAD_MAX_EXERCISE_FILE_MB?: string;
  UPLOAD_MAX_AGENT_DOCUMENT_MB?: string;
  UPLOAD_MAX_LANDING_IMAGE_MB?: string;
  UPLOAD_MAX_THUMBNAIL_MB?: string;
};

export function resolveUploadLimits(env: UploadLimitEnv): UploadLimits {
  const documentMb = parseUploadLimitMb(env.UPLOAD_MAX_DOCUMENT_MB, 5);
  const imageMb = parseUploadLimitMb(env.UPLOAD_MAX_IMAGE_MB, 5);
  const videoMb = parseUploadLimitMb(env.UPLOAD_MAX_VIDEO_MB, 800);
  const exerciseFileMb = parseUploadLimitMb(env.UPLOAD_MAX_EXERCISE_FILE_MB, 2);
  const agentDocumentMb = parseUploadLimitMb(env.UPLOAD_MAX_AGENT_DOCUMENT_MB, 5);
  const landingImageMb = parseUploadLimitMb(env.UPLOAD_MAX_LANDING_IMAGE_MB, 0.5);
  const thumbnailMb = parseUploadLimitMb(env.UPLOAD_MAX_THUMBNAIL_MB, 5);

  return {
    documentMb,
    imageMb,
    videoMb,
    exerciseFileMb,
    agentDocumentMb,
    landingImageMb,
    thumbnailMb,
    documentBytes: documentMb * BYTES_PER_MB,
    imageBytes: imageMb * BYTES_PER_MB,
    videoBytes: videoMb * BYTES_PER_MB,
    exerciseFileBytes: exerciseFileMb * BYTES_PER_MB,
    agentDocumentBytes: agentDocumentMb * BYTES_PER_MB,
    landingImageBytes: landingImageMb * BYTES_PER_MB,
    thumbnailBytes: thumbnailMb * BYTES_PER_MB
  };
}
