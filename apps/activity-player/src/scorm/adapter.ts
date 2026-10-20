import { Scorm12API } from 'scorm-again/scorm12';
import { Scorm2004API } from 'scorm-again/scorm2004';

import { createRuntimeHttpService } from './runtime-http';

export type ScormFormat = 'scorm12' | 'scorm2004';

export type ScormAdapter = Scorm12API | Scorm2004API;

type AdapterSettings = ConstructorParameters<typeof Scorm12API>[0];

declare global {
  interface Window {
    API?: Scorm12API;
    API_1484_11?: Scorm2004API;
  }
}

export interface LaunchState {
  format: ScormFormat;
  cmi: Record<string, unknown>;
  contentToken: string;
  launchPath: string;
  parentOrigin: string;
  parentOrigins?: string[];
  entry: string;
  commitSeq: number;
  mode: 'preview' | 'normal' | 'review';
  debug: boolean;
}

const CLIENT_LMS_RULE_FLAGS = {
  autoCompleteLessonStatus: false,
  mastery_override: false
} as const;

export function buildAdapterSettings(
  launchToken: string,
  debug: boolean,
  onCompleted?: () => void,
  onProgress?: () => void,
  initialCmi?: unknown
): AdapterSettings {
  return {
    autocommit: true,
    autocommitSeconds: 30,
    lmsCommitUrl: `/activity/scorm/runtime/${encodeURIComponent(launchToken)}/commit`,
    sendFullCommit: false,
    includeCommitSequence: true,
    terminateCommitPayloadField: 'terminate',
    selfReportSessionTime: false,
    logLevel: debug ? 1 : 4,
    httpService: createRuntimeHttpService({ onCompleted, onProgress, initialCmi }),
    ...CLIENT_LMS_RULE_FLAGS
  };
}

/**
 * Creates the run-time API for one module. Throws for unknown formats.
 */
export function createScormAdapter(format: ScormFormat, settings: AdapterSettings): ScormAdapter {
  if (format === 'scorm12') {
    return new Scorm12API(settings);
  }

  if (format === 'scorm2004') {
    return new Scorm2004API(settings);
  }

  throw new Error(`Unknown SCORM format: ${String(format)}`);
}

/**
 * Continues the server sequence after a resume. The player numbers every
 * commit from one, so a resumed module must start above the stored count.
 */
export function initializeCommitSequence(adapter: ScormAdapter, commitSeq: number): void {
  const current = Number(commitSeq);

  if (!Number.isFinite(current) || current < 0) return;

  (adapter as unknown as { _commitSequence: number })._commitSequence = Math.floor(current);
}

/**
 * Exposes the API where package discovery expects it. Throws when already exposed.
 */
export function exposeAdapter(format: ScormFormat, adapter: ScormAdapter): void {
  if (format === 'scorm12') {
    if (window.API) {
      throw new Error('window.API is already set');
    }

    window.API = adapter as Scorm12API;
    return;
  }

  if (window.API_1484_11) {
    throw new Error('window.API_1484_11 is already set');
  }

  window.API_1484_11 = adapter as Scorm2004API;
}

/**
 * Removes the API a finished module exposed, so the next module can expose its own.
 */
export function unexposeAdapter(format: ScormFormat): void {
  if (format === 'scorm12') {
    delete window.API;
    return;
  }

  delete window.API_1484_11;
}

export function initializeEventName(format: ScormFormat): string {
  return format === 'scorm12' ? 'LMSInitialize' : 'Initialize';
}

export function terminateEventName(format: ScormFormat): string {
  return format === 'scorm12' ? 'LMSFinish' : 'Terminate';
}
