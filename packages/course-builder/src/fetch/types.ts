export interface FetchOptions {
  accept?: string;
  maxBytes?: number;
  /** Keep the body as bytes in `bytes` (images) instead of decoding it to text. */
  binary?: boolean;
  timeoutMs?: number;
  signal?: AbortSignal;
}

export interface FetchResponse {
  /** The URL that answered, after HTTP redirects. */
  url: string;
  status: number;
  /** Header names are lower case. */
  headers: Record<string, string>;
  body: string;
  /** The raw body, only when the request asked for `binary`. */
  bytes?: Buffer;
  /** Every URL visited before `url`, in order. */
  redirects: string[];
  truncated: boolean;
}

export interface Fetcher {
  get(url: string, options?: FetchOptions): Promise<FetchResponse>;
}

export const FETCH_FAILURES = [
  'invalid-url',
  'blocked-address',
  'unreachable',
  'timeout',
  'too-many-redirects',
  'robots-disallowed',
  /** The host answered 429 or 503 and is paused for the rest of its cooldown: requests fail at once, unread. */
  'rate-limited'
] as const;

export type FetchFailure = (typeof FETCH_FAILURES)[number];

export class FetchError extends Error {
  constructor(
    readonly reason: FetchFailure,
    readonly url: string,
    readonly detail?: string
  ) {
    super(`${reason}: ${url}${detail ? ` (${detail})` : ''}`);
    this.name = 'FetchError';
  }
}
