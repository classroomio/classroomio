import assert from 'node:assert/strict';
import { createGithubStarsGetter, type StarsKvNamespace } from './github-stars.ts';

function createMemoryKv(): StarsKvNamespace & { store: Map<string, string> } {
  const store = new Map<string, string>();

  return {
    store,
    async get(key) {
      return store.get(key) ?? null;
    },
    async put(key, value) {
      store.set(key, value);
    }
  };
}

async function main() {
  const kv = createMemoryKv();
  let githubHits = 0;
  const originalFetch = globalThis.fetch;

  globalThis.fetch = (async () => {
    githubHits += 1;
    return new Response(JSON.stringify({ stargazers_count: 4242 }), {
      status: 200,
      headers: { 'content-type': 'application/json' }
    });
  }) as typeof fetch;

  try {
    const getStars = createGithubStarsGetter();

    const first = await getStars(kv);
    assert.equal(first, 4242);
    assert.equal(githubHits, 1);

    const second = await getStars(kv);
    assert.equal(second, 4242);
    assert.equal(githubHits, 1, 'memory L1 should prevent a second GitHub fetch');

    const stored = JSON.parse(kv.store.get('github:classroomio:stars')!);
    assert.equal(stored.stars, 4242);
    assert.equal(typeof stored.fetchedAt, 'number');

    // Fresh isolate (new getter) should read KV and skip GitHub while TTL is valid
    const getStarsFresh = createGithubStarsGetter();
    const fromKv = await getStarsFresh(kv);
    assert.equal(fromKv, 4242);
    assert.equal(githubHits, 1, 'fresh isolate should serve KV within 24h without GitHub');

    // Stale KV entry + GitHub failure → return last known stars
    kv.store.set(
      'github:classroomio:stars',
      JSON.stringify({ stars: 100, fetchedAt: Date.now() - 1000 * 60 * 60 * 25 })
    );
    globalThis.fetch = (async () => {
      githubHits += 1;
      return new Response('rate limited', { status: 403 });
    }) as typeof fetch;

    const getStarsStale = createGithubStarsGetter();
    const staleFallback = await getStarsStale(kv);
    assert.equal(staleFallback, 100);

    // Invalid GitHub payload must not overwrite the stale cache with zero
    globalThis.fetch = (async () => {
      githubHits += 1;
      return new Response(JSON.stringify({ message: 'ok' }), {
        status: 200,
        headers: { 'content-type': 'application/json' }
      });
    }) as typeof fetch;

    const getStarsInvalid = createGithubStarsGetter();
    const invalidFallback = await getStarsInvalid(kv);
    assert.equal(invalidFallback, 100);
    assert.equal(JSON.parse(kv.store.get('github:classroomio:stars')!).stars, 100);
  } finally {
    globalThis.fetch = originalFetch;
  }

  console.log('github-stars KV cache tests passed');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
