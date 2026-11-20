export interface FetchOptions {
  accept?: string;
  maxBytes?: number;
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
  'robots-disallowed'
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
