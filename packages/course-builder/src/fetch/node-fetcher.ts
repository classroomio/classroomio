import dns from 'node:dns';
import http from 'node:http';
import https from 'node:https';
import { isIP } from 'node:net';
import zlib from 'node:zlib';

import { isPrivateAddress } from './private-address';
import { FetchError, type FetchOptions, type FetchResponse, type Fetcher } from './types';

const MAX_REDIRECTS = 5;
const DEFAULT_MAX_BYTES = 8 * 1024 * 1024;
const DEFAULT_TIMEOUT_MS = 30_000;

interface Hop {
  status: number;
  headers: Record<string, string>;
  body: string;
  truncated: boolean;
}

const TRANSIENT_DNS_ERRORS = new Set(['ENOTFOUND', 'EAI_AGAIN', 'ETIMEOUT', 'ESERVFAIL']);

type LookupCallback = (
  error: NodeJS.ErrnoException | null,
  address: string | dns.LookupAddress[],
  family?: number
) => void;

type Resolver = (
  hostname: string,
  options: dns.LookupAllOptions,
  callback: (error: NodeJS.ErrnoException | null, addresses: dns.LookupAddress[]) => void
) => void;

export interface GuardedLookupOptions {
  resolve?: Resolver;
  retryDelaysMs?: number[];
  cacheMs?: number;
  now?: () => number;
}

/**
 * A DNS lookup that refuses private addresses on every answer, retries transient resolver failures, and remembers a
 * host's addresses briefly, so a resolver hiccup never loses a page and a large read does not resolve the same host
 * thousands of times.
 */
export function createGuardedLookup(options: GuardedLookupOptions = {}) {
  const resolve = options.resolve ?? (dns.lookup as unknown as Resolver);
  const retryDelaysMs = options.retryDelaysMs ?? [500, 1_500];
  const cacheMs = options.cacheMs ?? 60_000;
  const now = options.now ?? Date.now;
  const cache = new Map<string, { addresses: dns.LookupAddress[]; at: number }>();

  const resolveWithRetries = (
    hostname: string,
    lookupOptions: dns.LookupOptions,
    attempt: number,
    done: (error: NodeJS.ErrnoException | null, addresses: dns.LookupAddress[]) => void
  ) => {
    resolve(hostname, { ...lookupOptions, all: true }, (error, addresses) => {
      const transient = error && TRANSIENT_DNS_ERRORS.has(error.code ?? '');
      if (transient && attempt < retryDelaysMs.length) {
        setTimeout(() => resolveWithRetries(hostname, lookupOptions, attempt + 1, done), retryDelaysMs[attempt]);
        return;
      }

      done(error, addresses ?? []);
    });
  };

  return function guardedLookup(hostname: string, lookupOptions: dns.LookupOptions, callback: LookupCallback): void {
    const key = `${hostname}|${lookupOptions.family ?? 0}`;
    const answer = (addresses: dns.LookupAddress[]) => {
      const blocked = addresses.some((entry) => isPrivateAddress(entry.address));
      if (blocked || addresses.length === 0) {
        const blockedError = new Error('Address is not allowed') as NodeJS.ErrnoException;
        blockedError.code = 'EBLOCKED';

        return callback(blockedError, '', 4);
      }

      if (lookupOptions.all) return callback(null, addresses);

      return callback(null, addresses[0].address, addresses[0].family);
    };

    const cached = cache.get(key);
    if (cached && now() - cached.at < cacheMs) {
      process.nextTick(() => answer(cached.addresses));
      return;
    }

    resolveWithRetries(hostname, lookupOptions, 0, (error, addresses) => {
      if (error) return callback(error, '', 4);

      cache.set(key, { addresses, at: now() });
      answer(addresses);
    });
  };
}

const guardedLookup = createGuardedLookup();

function assertPublicHttpUrl(rawUrl: string): URL {
  let parsed: URL;

  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new FetchError('invalid-url', rawUrl);
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') throw new FetchError('invalid-url', rawUrl);

  const bareHost = parsed.hostname.replace(/^\[|\]$/g, '');
  if (parsed.username || parsed.password || isIP(bareHost) !== 0) throw new FetchError('blocked-address', rawUrl);

  return parsed;
}

function flattenHeaders(raw: http.IncomingHttpHeaders): Record<string, string> {
  const headers: Record<string, string> = {};
  for (const [name, value] of Object.entries(raw)) {
    if (value !== undefined) headers[name] = Array.isArray(value) ? value.join(', ') : value;
  }

  return headers;
}

function decoderFor(encoding: string): NodeJS.ReadWriteStream | null {
  if (encoding === 'gzip' || encoding === 'x-gzip') return zlib.createGunzip();
  if (encoding === 'deflate') return zlib.createInflate();
  if (encoding === 'br') return zlib.createBrotliDecompress();

  return null;
}

function requestOnce(
  url: URL,
  userAgent: string,
  options: Required<Omit<FetchOptions, 'signal'>>,
  signal?: AbortSignal
) {
  return new Promise<Hop>((resolve, reject) => {
    const transport = url.protocol === 'https:' ? https : http;
    const request = transport.request(url, {
      method: 'GET',
      lookup: guardedLookup as never,
      signal,
      headers: { accept: options.accept, 'accept-encoding': 'gzip, deflate, br', 'user-agent': userAgent }
    });

    const deadline = setTimeout(() => request.destroy(new FetchError('timeout', url.href)), options.timeoutMs);
    request.on('close', () => clearTimeout(deadline));
    request.on('error', (error: NodeJS.ErrnoException) => {
      if (error instanceof FetchError) return reject(error);
      if (error.code === 'EBLOCKED') return reject(new FetchError('blocked-address', url.href));

      reject(new FetchError('unreachable', url.href, error.code ?? error.message));
    });

    request.on('response', (response) => {
      const status = response.statusCode ?? 0;
      const headers = flattenHeaders(response.headers);

      if (status >= 300 && status < 400) {
        response.resume();

        return resolve({ status, headers, body: '', truncated: false });
      }

      const decoder = decoderFor((headers['content-encoding'] ?? '').trim().toLowerCase());
      const stream: NodeJS.ReadableStream = decoder ? response.pipe(decoder) : response;
      const chunks: Buffer[] = [];
      let bytes = 0;
      let truncated = false;

      const finish = () => resolve({ status, headers, body: Buffer.concat(chunks).toString('utf8'), truncated });

      stream.on('data', (chunk: Buffer) => {
        if (truncated) return;

        bytes += chunk.byteLength;
        chunks.push(chunk);
        if (bytes >= options.maxBytes) {
          truncated = true;
          response.destroy();
          finish();
        }
      });
      stream.on('end', finish);
      stream.on('error', (error: Error) => reject(new FetchError('unreachable', url.href, error.message)));
    });

    request.end();
  });
}

/**
 * A fetcher for public web pages only. Every connection, including each redirect hop, is checked against private
 * address ranges when it connects. Follows at most 5 redirects and decompresses gzip, deflate and brotli bodies.
 */
export function createNodeFetcher(userAgent: string): Fetcher {
  return {
    async get(rawUrl: string, options: FetchOptions = {}): Promise<FetchResponse> {
      const settings = {
        accept: options.accept ?? 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.8',
        maxBytes: options.maxBytes ?? DEFAULT_MAX_BYTES,
        timeoutMs: options.timeoutMs ?? DEFAULT_TIMEOUT_MS
      };
      const redirects: string[] = [];
      let current = assertPublicHttpUrl(rawUrl);

      for (let hop = 0; hop <= MAX_REDIRECTS; hop += 1) {
        const response = await requestOnce(current, userAgent, settings, options.signal);
        const location = response.headers.location;

        if (response.status >= 300 && response.status < 400 && location) {
          redirects.push(current.href);
          current = assertPublicHttpUrl(new URL(location, current).href);
          continue;
        }

        return { url: current.href, redirects, ...response };
      }

      throw new FetchError('too-many-redirects', rawUrl, current.href);
    }
  };
}
