import { createNodeFetcher } from './node-fetcher';
import { ALLOW_ALL_ROBOTS, DISALLOW_ALL_ROBOTS, parseRobots, type RobotsRules } from './robots';
import { FetchError, type FetchFailure, type FetchOptions, type FetchResponse, type Fetcher } from './types';

export interface PoliteFetcherOptions {
  /** The product token matched against robots.txt user-agent lines, e.g. `ClassroomIO-CourseBuilder`. */
  productToken: string;
  minGapMs?: number;
  maxCrawlDelayMs?: number;
  maxRetries?: number;
  maxRetryWaitMs?: number;
  /** The longest a 429 or 503 is waited out before the host is paused instead: past this, the page is skipped. */
  maxStatusWaitMs?: number;
  /** Consecutive 429/503 answers that pause the host, so a throttled site costs a source its tail and no more. */
  throttleAfter?: number;
  throttleCooldownMs?: number;
  sleep?: (ms: number) => Promise<void>;
  now?: () => number;
}

const RETRY_STATUSES = new Set([429, 503]);
/** The gap a host gets after it answers 429 or 503, doubled on each later one up to the crawl-delay ceiling. */
const SLOWED_GAP_MS = 1_000;
const TRANSIENT_FAILURES = new Set<FetchFailure>(['unreachable', 'timeout']);
const NETWORK_RETRY_MS = 2_000;
/**
 * A 429 is answered by waiting it out only when the site asks for a short wait. A site that asks for a long one, or that
 * throttles twice in a row, is paused for its cooldown instead: the rest of its pages then fail in microseconds rather
 * than cost the build a minute each, and the site is left alone. A source that was throttled reads what it already had.
 */
const MAX_STATUS_WAIT_MS = 5_000;
const THROTTLE_AFTER = 2;
const THROTTLE_COOLDOWN_MS = 60_000;
/**
 * Extra waits before a robots.txt that keeps failing is taken as "disallow everything" (RFC 9309). Failures under load
 * pass within seconds, and giving up early would lose the whole source. A host that stayed silent until every attempt
 * timed out has already been waited on for minutes, so it gets no extra rounds.
 */
const ROBOTS_PATIENCE_MS = [10_000, 20_000, 30_000];

const defaultSleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Failures that waiting does not change: a host DNS does not know (after the lookup's own retries), a TLS handshake the
 * server refuses, or a certificate that does not match. Retrying them, or waiting for their robots.txt, only delays the
 * answer; discovery probes several subdomains that fail this way under wildcard DNS.
 */
const PERMANENT_NETWORK_FAILURES = new Set([
  'ENOTFOUND',
  'EPROTO',
  'ERR_TLS_CERT_ALTNAME_INVALID',
  'CERT_HAS_EXPIRED',
  'DEPTH_ZERO_SELF_SIGNED_CERT',
  'SELF_SIGNED_CERT_IN_CHAIN',
  'UNABLE_TO_VERIFY_LEAF_SIGNATURE'
]);

function isPermanentFailure(error: unknown): error is FetchError {
  return (
    error instanceof FetchError && error.reason === 'unreachable' && PERMANENT_NETWORK_FAILURES.has(error.detail ?? '')
  );
}

/**
 * Wraps a fetcher so each host gets one request at a time, and requests start at most once per gap: the larger of
 * `minGapMs` and the host's robots.txt crawl delay, counted from the previous request's start, as crawlers read
 * `Crawl-delay`. A host that answers 429 or 503 is read more slowly for the rest of the run (`SLOWED_GAP_MS`, doubled
 * on each later one). A response slower than the gap is followed at once, still one connection at a time. Refuses URLs robots.txt disallows, retries 429 and 503 answers after their Retry-After, and
 * retries network failures and timeouts with backoff, so a passing glitch never loses a page. A robots.txt that cannot be
 * reached at all means nothing may be read (RFC 9309).
 */
export class PoliteFetcher implements Fetcher {
  private readonly hostQueues = new Map<string, Promise<unknown>>();
  private readonly lastRequestAt = new Map<string, number>();
  private readonly slowedGapMs = new Map<string, number>();
  private readonly robotsByOrigin = new Map<string, Promise<RobotsRules>>();
  /** Per host: how many 429/503 answers came in a row, and until when the host is paused. */
  private readonly throttling = new Map<string, { strikes: number; pausedUntil: number }>();
  private readonly settings: Required<PoliteFetcherOptions>;

  constructor(
    private readonly inner: Fetcher,
    options: PoliteFetcherOptions
  ) {
    this.settings = {
      minGapMs: 200,
      maxCrawlDelayMs: 10_000,
      maxRetries: 3,
      maxRetryWaitMs: 60_000,
      maxStatusWaitMs: MAX_STATUS_WAIT_MS,
      throttleAfter: THROTTLE_AFTER,
      throttleCooldownMs: THROTTLE_COOLDOWN_MS,
      sleep: defaultSleep,
      now: Date.now,
      ...options
    };
  }

  async get(url: string, options?: FetchOptions): Promise<FetchResponse> {
    const parsed = this.parse(url);
    const paused = this.pausedUntil(parsed.host);
    if (paused > 0) throw new FetchError('rate-limited', parsed.href, `paused ${Math.ceil(paused / 1000)}s`);

    const rules = await this.robots(parsed.origin);
    if (!rules.isAllowed(parsed.href)) throw new FetchError('robots-disallowed', parsed.href);

    return this.schedule(parsed.host, rules.crawlDelayMs, (markRequest) =>
      this.getWithRetries(parsed.href, options, markRequest, parsed.host)
    );
  }

  /** The robots.txt rules of an origin, read once. A missing file allows everything; a server error allows nothing. */
  robots(origin: string): Promise<RobotsRules> {
    const cached = this.robotsByOrigin.get(origin);
    if (cached) return cached;

    const pending = this.readRobots(origin);
    this.robotsByOrigin.set(origin, pending);

    return pending;
  }

  private parse(url: string): URL {
    try {
      return new URL(url);
    } catch {
      throw new FetchError('invalid-url', url);
    }
  }

  private async readRobots(origin: string): Promise<RobotsRules> {
    const robotsUrl = `${origin}/robots.txt`;
    const host = new URL(origin).host;

    for (let round = 0; ; round += 1) {
      const response = await this.schedule(host, 0, (markRequest) =>
        this.getWithRetries(robotsUrl, { accept: 'text/plain', maxBytes: 512 * 1024 }, markRequest, host)
      ).catch((error: unknown) => {
        const silent = error instanceof FetchError && error.reason === 'timeout';
        const paused = error instanceof FetchError && error.reason === 'rate-limited';
        if (isPermanentFailure(error) || silent || paused) throw error;

        return null;
      });
      if (response && response.status < 500) {
        return response.status === 200
          ? parseRobots(robotsUrl, response.body, this.settings.productToken)
          : ALLOW_ALL_ROBOTS;
      }
      if (round >= ROBOTS_PATIENCE_MS.length) return DISALLOW_ALL_ROBOTS;

      await this.settings.sleep(ROBOTS_PATIENCE_MS[round]);
    }
  }

  /** `markRequest` is called as each attempt starts, so a retry counts as the host's latest request. */
  private async getWithRetries(url: string, options: FetchOptions | undefined, markRequest: () => void, host: string) {
    for (let attempt = 0; ; attempt += 1) {
      let response: FetchResponse;
      try {
        markRequest();
        response = await this.inner.get(url, options);
      } catch (error) {
        const transient =
          error instanceof FetchError && TRANSIENT_FAILURES.has(error.reason) && !isPermanentFailure(error);
        if (!transient || attempt >= this.settings.maxRetries) throw error;

        await this.settings.sleep(Math.min(NETWORK_RETRY_MS * 2 ** attempt, this.settings.maxRetryWaitMs));
        continue;
      }
      if (!RETRY_STATUSES.has(response.status)) {
        this.throttling.delete(host);

        return response;
      }

      this.slowDown(host);
      const waitMs = this.retryWaitMs(response, attempt);
      if (this.strike(host, waitMs)) return response;
      if (attempt >= this.settings.maxRetries) return response;

      await this.settings.sleep(waitMs);
    }
  }

  /** The host's pause remaining in ms, 0 when it may be read. */
  private pausedUntil(host: string): number {
    const state = this.throttling.get(host);
    if (!state) return 0;

    const remaining = state.pausedUntil - this.settings.now();
    if (remaining <= 0) {
      this.throttling.delete(host);

      return 0;
    }

    return remaining;
  }

  /**
   * Records a 429/503: a short wait is retried, a long one or a second strike in a row pauses the host for its cooldown
   * and answers this request as it came. True means the caller must not retry.
   */
  private strike(host: string, waitMs: number): boolean {
    const strikes = (this.throttling.get(host)?.strikes ?? 0) + 1;
    const pause = waitMs > this.settings.maxStatusWaitMs || strikes >= this.settings.throttleAfter;
    const pausedUntil = pause
      ? this.settings.now() + Math.min(Math.max(waitMs, 1_000), this.settings.throttleCooldownMs)
      : 0;

    this.throttling.set(host, { strikes, pausedUntil });

    return pause;
  }

  private slowDown(host: string): void {
    const current = this.slowedGapMs.get(host);
    const next = current === undefined ? SLOWED_GAP_MS : current * 2;
    this.slowedGapMs.set(host, Math.min(next, this.settings.maxCrawlDelayMs));
  }

  private retryWaitMs(response: FetchResponse, attempt: number): number {
    const retryAfter = Number(response.headers['retry-after']);
    const wait = Number.isFinite(retryAfter) && retryAfter >= 0 ? retryAfter * 1000 : 5000 * 2 ** attempt;

    return Math.min(wait, this.settings.maxRetryWaitMs);
  }

  private schedule<T>(host: string, crawlDelayMs: number, task: (markRequest: () => void) => Promise<T>): Promise<T> {
    const previous = this.hostQueues.get(host) ?? Promise.resolve();

    const run = previous.then(async () => {
      const gapMs = Math.max(
        this.settings.minGapMs,
        Math.min(crawlDelayMs, this.settings.maxCrawlDelayMs),
        this.slowedGapMs.get(host) ?? 0
      );
      const lastAt = this.lastRequestAt.get(host);
      const waitMs = lastAt === undefined ? 0 : gapMs - (this.settings.now() - lastAt);
      if (waitMs > 0) await this.settings.sleep(waitMs);

      return task(() => this.lastRequestAt.set(host, this.settings.now()));
    });

    this.hostQueues.set(
      host,
      run.catch(() => undefined)
    );

    return run;
  }
}

export interface CreateFetcherOptions extends Omit<PoliteFetcherOptions, 'productToken'> {
  productToken?: string;
  version?: string;
  contactUrl?: string;
}

/** The default fetcher: public addresses only, polite per host, identified by a named user agent. */
export function createFetcher(options: CreateFetcherOptions = {}): PoliteFetcher {
  const productToken = options.productToken ?? 'ClassroomIO-CourseBuilder';
  const userAgent = `${productToken}/${options.version ?? '0.1'} (+${options.contactUrl ?? 'https://classroomio.com'})`;

  return new PoliteFetcher(createNodeFetcher(userAgent), { ...options, productToken });
}
