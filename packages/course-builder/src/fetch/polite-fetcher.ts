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
  sleep?: (ms: number) => Promise<void>;
  now?: () => number;
}

const RETRY_STATUSES = new Set([429, 503]);
const TRANSIENT_FAILURES = new Set<FetchFailure>(['unreachable', 'timeout']);
const NETWORK_RETRY_MS = 2_000;
/**
 * Extra waits before a robots.txt that keeps failing is taken as "disallow everything" (RFC 9309). Failures under load
 * pass within seconds, and giving up early would lose the whole source.
 */
const ROBOTS_PATIENCE_MS = [10_000, 20_000, 30_000];

const defaultSleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Wraps a fetcher so each host gets one request at a time, spaced by the larger of `minGapMs` and the host's
 * robots.txt crawl delay. Refuses URLs robots.txt disallows, retries 429 and 503 answers after their Retry-After, and
 * retries network failures and timeouts with backoff, so a passing glitch never loses a page. A robots.txt that cannot be
 * reached at all means nothing may be read (RFC 9309).
 */
export class PoliteFetcher implements Fetcher {
  private readonly hostQueues = new Map<string, Promise<unknown>>();
  private readonly lastRequestAt = new Map<string, number>();
  private readonly robotsByOrigin = new Map<string, Promise<RobotsRules>>();
  private readonly settings: Required<PoliteFetcherOptions>;

  constructor(
    private readonly inner: Fetcher,
    options: PoliteFetcherOptions
  ) {
    this.settings = {
      minGapMs: 350,
      maxCrawlDelayMs: 10_000,
      maxRetries: 3,
      maxRetryWaitMs: 60_000,
      sleep: defaultSleep,
      now: Date.now,
      ...options
    };
  }

  async get(url: string, options?: FetchOptions): Promise<FetchResponse> {
    const parsed = this.parse(url);
    const rules = await this.robots(parsed.origin);
    if (!rules.isAllowed(parsed.href)) throw new FetchError('robots-disallowed', parsed.href);

    return this.schedule(parsed.host, rules.crawlDelayMs, () => this.getWithRetries(parsed.href, options));
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
      const response = await this.schedule(host, 0, () =>
        this.getWithRetries(robotsUrl, { accept: 'text/plain', maxBytes: 512 * 1024 })
      ).catch(() => null);
      if (response && response.status < 500) {
        return response.status === 200
          ? parseRobots(robotsUrl, response.body, this.settings.productToken)
          : ALLOW_ALL_ROBOTS;
      }
      if (round >= ROBOTS_PATIENCE_MS.length) return DISALLOW_ALL_ROBOTS;

      await this.settings.sleep(ROBOTS_PATIENCE_MS[round]);
    }
  }

  private async getWithRetries(url: string, options?: FetchOptions): Promise<FetchResponse> {
    for (let attempt = 0; ; attempt += 1) {
      let response: FetchResponse;
      try {
        response = await this.inner.get(url, options);
      } catch (error) {
        const transient = error instanceof FetchError && TRANSIENT_FAILURES.has(error.reason);
        if (!transient || attempt >= this.settings.maxRetries) throw error;

        await this.settings.sleep(Math.min(NETWORK_RETRY_MS * 2 ** attempt, this.settings.maxRetryWaitMs));
        continue;
      }
      if (!RETRY_STATUSES.has(response.status) || attempt >= this.settings.maxRetries) return response;

      await this.settings.sleep(this.retryWaitMs(response, attempt));
    }
  }

  private retryWaitMs(response: FetchResponse, attempt: number): number {
    const retryAfter = Number(response.headers['retry-after']);
    const wait = Number.isFinite(retryAfter) && retryAfter >= 0 ? retryAfter * 1000 : 5000 * 2 ** attempt;

    return Math.min(wait, this.settings.maxRetryWaitMs);
  }

  private schedule<T>(host: string, crawlDelayMs: number, task: () => Promise<T>): Promise<T> {
    const gapMs = Math.max(this.settings.minGapMs, Math.min(crawlDelayMs, this.settings.maxCrawlDelayMs));
    const previous = this.hostQueues.get(host) ?? Promise.resolve();

    const run = previous.then(async () => {
      const lastAt = this.lastRequestAt.get(host);
      const waitMs = lastAt === undefined ? 0 : gapMs - (this.settings.now() - lastAt);
      if (waitMs > 0) await this.settings.sleep(waitMs);

      try {
        return await task();
      } finally {
        this.lastRequestAt.set(host, this.settings.now());
      }
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
