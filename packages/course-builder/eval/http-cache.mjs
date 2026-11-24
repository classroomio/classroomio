/**
 * The evaluation's HTTP cache (eval-data/http-cache, git-ignored): responses our reader already fetched, so a rerun
 * reads them from disk instead of fetching them again. A cached page is only served while robots.txt still allows it.
 */
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gunzipSync, gzipSync } from 'node:zlib';

import { ALLOW_ALL_ROBOTS, isBotChallenge } from '../dist/index.js';

export const CACHE_DIR = join(fileURLToPath(new URL('.', import.meta.url)), '..', 'eval-data', 'http-cache');
const CACHEABLE_STATUSES = new Set([200, 404, 410]);

export function cachePathOf(url, accept) {
  return join(
    CACHE_DIR,
    `${createHash('sha1')
      .update(`${accept ?? ''} ${url}`)
      .digest('hex')}.json.gz`
  );
}

/** Wraps a fetcher with the cache. `offline` serves only cached responses; `fresh` fetches everything again. */
export function withDiskCache(inner, { offline = false, fresh = false } = {}) {
  mkdirSync(CACHE_DIR, { recursive: true });
  const stats = { hits: 0, misses: 0 };
  const cached = async (path) => {
    stats.hits += 1;
    await new Promise((resolve) => setImmediate(resolve));

    return JSON.parse(gunzipSync(readFileSync(path)).toString('utf8'));
  };

  return {
    stats,
    robots: (origin) => (offline ? Promise.resolve(ALLOW_ALL_ROBOTS) : inner.robots(origin)),
    async get(url, options) {
      const path = cachePathOf(url, options?.accept);
      if (offline) {
        if (!existsSync(path)) throw new Error(`offline: not in the cache: ${url}`);

        return cached(path);
      }
      if (!fresh && existsSync(path)) {
        const rules = await inner.robots(new URL(url).origin);
        if (rules.isAllowed(url)) return cached(path);
      }

      stats.misses += 1;
      const response = await inner.get(url, options);
      if (CACHEABLE_STATUSES.has(response.status) && !response.truncated && !isBotChallenge(response)) {
        writeFileSync(path, gzipSync(JSON.stringify(response)));
      }

      return response;
    }
  };
}
