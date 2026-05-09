export const VIDEO_RECORDING_DEFAULT_MAX_DURATION_SECONDS = 60;
export const VIDEO_RECORDING_PLATFORM_MAX_DURATION_SECONDS = 120;
export const VIDEO_RECORDING_MIN_DURATION_SECONDS = 1;

export function getVideoRecordingMaxDurationSeconds(settings?: Record<string, unknown> | null): number {
  const rawDuration = settings?.maxDurationSeconds;
  const duration = typeof rawDuration === 'number' ? rawDuration : rawDuration != null ? Number(rawDuration) : NaN;

  if (!Number.isFinite(duration) || duration <= 0) {
    return VIDEO_RECORDING_DEFAULT_MAX_DURATION_SECONDS;
  }

  return Math.min(Math.round(duration), VIDEO_RECORDING_PLATFORM_MAX_DURATION_SECONDS);
}
