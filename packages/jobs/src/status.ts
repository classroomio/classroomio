/**
 * Shared run/job status types and the polling envelope.
 *
 * These are wire-level types: the API returns them, the dashboard polls them.
 * Keep them stable — they're the contract for every queued domain.
 */

export const JOB_STATUS = {
  queued: 'queued',
  running: 'running',
  completed: 'completed',
  failed: 'failed',
  canceled: 'canceled'
} as const;

export type JobStatus = (typeof JOB_STATUS)[keyof typeof JOB_STATUS];

export const TERMINAL_JOB_STATUSES: readonly JobStatus[] = [
  JOB_STATUS.completed,
  JOB_STATUS.failed,
  JOB_STATUS.canceled
];

export function isTerminalStatus(status: string | null | undefined): status is JobStatus {
  return Boolean(status) && (TERMINAL_JOB_STATUSES as readonly string[]).includes(status as string);
}

export interface JobError {
  code: string;
  message: string;
  details?: unknown;
}

export interface JobEvent {
  at: string;
  type: string;
  message?: string;
  data?: unknown;
}

/**
 * The single envelope every `GET /jobs/:id` endpoint returns. Domain-specific
 * routes can extend `result`/`events` but must not change the shape.
 */
export interface JobEnvelope<TResult = Record<string, unknown> | null> {
  job: {
    id: string;
    domain: string;
    status: JobStatus;
    stage: string | null;
    progressPercent: number | null;
    updatedAt: string;
    createdAt: string;
    result: TResult;
    error: JobError | null;
    warnings?: string[];
    cancelRequestedAt?: string | null;
    attempt?: number;
    maxAttempts?: number;
  };
  events: JobEvent[];
  /** Suggested next poll delay in ms. The dashboard poller uses this. */
  nextPollMs: number;
}

/**
 * Default backoff schedule for the dashboard poller. Returns the suggested
 * delay in ms based on the job's status and how many polls have happened.
 */
export function suggestNextPollMs(status: JobStatus, pollCount: number): number {
  if (isTerminalStatus(status)) {
    return 0;
  }

  if (pollCount < 5) return 1_000;
  if (pollCount < 15) return 2_000;
  return 5_000;
}
