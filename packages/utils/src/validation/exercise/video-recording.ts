import * as z from 'zod';
import { VIDEO_RECORDING_PLATFORM_MAX_DURATION_SECONDS } from '@cio/question-types';

export const VIDEO_RECORDING_MIME_TYPES = ['video/webm', 'video/mp4', 'video/quicktime'] as const;

export const ZExerciseVideoRecordingParam = z.object({
  exerciseId: z.string().min(1),
  questionId: z.string().regex(/^\d+$/).transform(Number)
});

export const ZExerciseVideoRecordingPlaybackParam = ZExerciseVideoRecordingParam.extend({
  submissionId: z.string().uuid()
});

export const ZExerciseVideoRecordingUploadInit = z.object({
  fileName: z.string().min(1),
  mimeType: z.enum(VIDEO_RECORDING_MIME_TYPES),
  size: z.number().int().positive()
});

export const ZExerciseVideoRecordingUploadComplete = z.object({
  assetId: z.string().uuid(),
  storageKey: z.string().min(1),
  fileName: z.string().min(1),
  mimeType: z.enum(VIDEO_RECORDING_MIME_TYPES),
  size: z.number().int().positive(),
  durationSeconds: z
    .number()
    .positive()
    .max(VIDEO_RECORDING_PLATFORM_MAX_DURATION_SECONDS + 2),
  recordedAt: z.string().datetime(),
  retakeCount: z.number().int().min(0).optional()
});

export type TExerciseVideoRecordingParam = z.infer<typeof ZExerciseVideoRecordingParam>;
export type TExerciseVideoRecordingPlaybackParam = z.infer<typeof ZExerciseVideoRecordingPlaybackParam>;
export type TExerciseVideoRecordingUploadInit = z.infer<typeof ZExerciseVideoRecordingUploadInit>;
export type TExerciseVideoRecordingUploadComplete = z.infer<typeof ZExerciseVideoRecordingUploadComplete>;
