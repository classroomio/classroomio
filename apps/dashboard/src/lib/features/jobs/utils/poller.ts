/**
 * Reusable poller for the standardized job envelope. Honors the
 * `nextPollMs` hint the API returns, stops on terminal states, and exposes
 * a manual `poke()` that triggers an immediate refresh on user interaction.
 *
 * Designed to live in `.svelte.ts` callers so reactive consumers can pass an
 * `onUpdate` handler that mutates `$state` cleanly.
 */
export interface JobLikeStatus {
  status: 'queued' | 'running' | 'completed' | 'failed' | 'canceled';
}

export interface JobLikeEnvelope<TJob extends JobLikeStatus> {
  job: TJob;
  nextPollMs: number;
}

export interface JobPollerOptions<TEnvelope extends JobLikeEnvelope<JobLikeStatus>> {
  /** Fetcher called on each poll. Should resolve to the envelope or null when missing. */
  fetch: () => Promise<TEnvelope | null>;
  /** Called whenever a fresh envelope arrives (including the first response). */
  onUpdate?: (envelope: TEnvelope) => void;
  /** Called when the poll throws. Defaults to console.error. */
  onError?: (error: unknown) => void;
  /** Override the floor between polls. Defaults to 500ms. */
  minIntervalMs?: number;
  /** Override the ceiling between polls. Defaults to 30s. */
  maxIntervalMs?: number;
}

export class JobPoller<TEnvelope extends JobLikeEnvelope<JobLikeStatus>> {
  private timer: ReturnType<typeof setTimeout> | null = null;
  private inFlight = false;
  private stopped = false;
  private readonly minIntervalMs: number;
  private readonly maxIntervalMs: number;

  constructor(private readonly options: JobPollerOptions<TEnvelope>) {
    this.minIntervalMs = options.minIntervalMs ?? 500;
    this.maxIntervalMs = options.maxIntervalMs ?? 30_000;
  }

  start(): void {
    if (this.stopped) return;

    void this.tick();
  }

  /** Trigger an immediate poll on user interaction (e.g. tab focus). */
  poke(): void {
    if (this.stopped) return;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    void this.tick();
  }

  stop(): void {
    this.stopped = true;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  private clampInterval(suggestedMs: number): number {
    return Math.min(Math.max(suggestedMs, this.minIntervalMs), this.maxIntervalMs);
  }

  private async tick(): Promise<void> {
    if (this.stopped || this.inFlight) return;

    this.inFlight = true;
    let envelope: TEnvelope | null = null;
    try {
      envelope = await this.options.fetch();
      if (envelope) this.options.onUpdate?.(envelope);
    } catch (error) {
      const handler = this.options.onError ?? ((err) => console.error('JobPoller error:', err));
      handler(error);
    } finally {
      this.inFlight = false;
    }

    if (this.stopped) return;

    if (
      envelope &&
      (envelope.job.status === 'completed' || envelope.job.status === 'failed' || envelope.job.status === 'canceled')
    ) {
      return;
    }

    const delay = this.clampInterval(envelope?.nextPollMs ?? 2_000);
    this.timer = setTimeout(() => void this.tick(), delay);
  }
}
