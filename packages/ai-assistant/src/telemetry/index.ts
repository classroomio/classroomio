import type { TelemetrySettings } from 'ai';
import { telemetryDev } from '@telemetry-dev/ai-sdk/v6';

type AiTelemetryMetadata = Record<string, string | number | boolean | null | undefined>;

function logTelemetryError(error: unknown) {
  console.error('[telemetry.dev] export failed:', error);
}

function exportInBackground(exportPromise: Promise<unknown>) {
  exportPromise.catch(logTelemetryError);
}

/**
 * Builds AI SDK `experimental_telemetry` settings that export the call to telemetry.dev.
 * `userId` and `sessionId` metadata become the trace's user and conversation; other keys are kept as metadata.
 * Sends nothing when `TELEMETRY_DEV_API_KEY` is unset.
 */
export function createAiTelemetry(functionId: string, metadata: AiTelemetryMetadata = {}): TelemetrySettings {
  const definedMetadata: Record<string, string | number | boolean> = {};

  for (const [key, value] of Object.entries(metadata)) {
    if (value !== null && value !== undefined) {
      definedMetadata[key] = value;
    }
  }

  // AI SDK 6 integrations hold state for one generation, so each call needs a fresh instance.
  const integration = telemetryDev({
    serviceName: process.env.OTEL_SERVICE_NAME ?? 'classroomio',
    waitUntil: exportInBackground,
    onError: logTelemetryError
  });

  return { functionId, metadata: definedMetadata, integrations: [integration] };
}
