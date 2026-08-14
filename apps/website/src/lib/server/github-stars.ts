const GITHUB_REPO_URL = 'https://api.github.com/repos/classroomio/classroomio';
const CACHE_TTL_MS = 1000 * 60 * 60 * 24;
const KV_KEY = 'github:classroomio:stars';

type StarsCacheEntry = {
  stars: number;
  fetchedAt: number;
};

/** Minimal KV surface so we do not hard-depend on workers-types at compile time. */
export type StarsKvNamespace = {
  get(key: string): Promise<string | null>;
  put(key: string, value: string): Promise<void>;
};

function isFresh(entry: StarsCacheEntry, now: number) {
  return entry.fetchedAt > 0 && now - entry.fetchedAt < CACHE_TTL_MS;
}

function parseCacheEntry(raw: string | null): StarsCacheEntry | null {
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<StarsCacheEntry>;

    if (typeof parsed.stars !== 'number' || typeof parsed.fetchedAt !== 'number') {
      return null;
    }

    return { stars: parsed.stars, fetchedAt: parsed.fetchedAt };
  } catch (error) {
    console.error('getGithubStars error: failed to parse KV cache entry', error);
    return null;
  }
}

async function readKv(kv: StarsKvNamespace | null | undefined): Promise<StarsCacheEntry | null> {
  if (!kv) {
    return null;
  }

  try {
    const raw = await kv.get(KV_KEY);
    return parseCacheEntry(raw);
  } catch (error) {
    console.error('getGithubStars error: failed to read KV', error);
    return null;
  }
}

async function writeKv(kv: StarsKvNamespace | null | undefined, entry: StarsCacheEntry) {
  if (!kv) {
    return;
  }

  try {
    await kv.put(KV_KEY, JSON.stringify(entry));
  } catch (error) {
    console.error('getGithubStars error: failed to write KV', error);
  }
}

async function fetchStarsFromGithub(): Promise<number> {
  const response = await fetch(GITHUB_REPO_URL, {
    headers: {
      Accept: 'application/vnd.github+json',
      'User-Agent': 'classroomio-website'
    }
  });

  if (!response.ok) {
    throw new Error(`GitHub API returned ${response.status}`);
  }

  const data = (await response.json()) as { stargazers_count?: unknown };
  return typeof data.stargazers_count === 'number' ? data.stargazers_count : 0;
}

/** Factory used by tests so each suite gets an isolated memory cache. */
export function createGithubStarsGetter() {
  const memoryCache: StarsCacheEntry = {
    stars: 0,
    fetchedAt: 0
  };

  let inFlightFetch: Promise<number> | null = null;

  async function resolveStars(kv: StarsKvNamespace | null | undefined, now: number): Promise<number> {
    const kvEntry = await readKv(kv);

    if (kvEntry && isFresh(kvEntry, now)) {
      memoryCache.stars = kvEntry.stars;
      memoryCache.fetchedAt = kvEntry.fetchedAt;
      return kvEntry.stars;
    }

    try {
      const stars = await fetchStarsFromGithub();

      memoryCache.stars = stars;
      memoryCache.fetchedAt = now;

      await writeKv(kv, { stars, fetchedAt: now });

      return stars;
    } catch (error) {
      console.error('getGithubStars error:', error);

      if (memoryCache.fetchedAt > 0) {
        return memoryCache.stars;
      }

      if (kvEntry) {
        memoryCache.stars = kvEntry.stars;
        memoryCache.fetchedAt = kvEntry.fetchedAt;
        return kvEntry.stars;
      }

      return 0;
    }
  }

  return async function getGithubStars(kv?: StarsKvNamespace | null): Promise<number> {
    const now = Date.now();

    if (isFresh(memoryCache, now)) {
      return memoryCache.stars;
    }

    if (inFlightFetch) {
      return inFlightFetch;
    }

    inFlightFetch = resolveStars(kv, now).finally(() => {
      inFlightFetch = null;
    });

    return inFlightFetch;
  };
}

const defaultGetGithubStars = createGithubStarsGetter();

/**
 * Returns the ClassroomIO GitHub star count.
 * Uses isolate memory as L1 and Cloudflare KV (`CACHE`) as L2 so the value
 * survives deploys and is refreshed from GitHub at most once every 24 hours.
 */
export async function getGithubStars(kv?: StarsKvNamespace | null): Promise<number> {
  return defaultGetGithubStars(kv);
}
