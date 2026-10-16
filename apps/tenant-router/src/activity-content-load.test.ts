import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ACTIVITY_CACHE_CONTROL,
  handleActivityContentRequest,
  isoWeekIndex,
  sha256Hex,
  type ActivityContentEnv
} from './activity-content';

const SECRET = 'load-test-secret-'.repeat(4);
const CONTENT_DOMAIN = 'classroomio-content.com';
const HOST = 'k7f3q2.classroomio-content.com';
const ORG = 'k7f3q2';
const PREFIX = 'scorm/asset-load/v3';
const NOW = Date.UTC(2026, 9, 9, 12, 0, 0);
const BODY = '<html>load package</html>';

function base64UrlEncode(input: string): string {
  return Buffer.from(input, 'utf8').toString('base64url');
}

async function mintContentToken(claims: { org: string; p: string; anc: string[]; wk: number }): Promise<string> {
  const body = base64UrlEncode(JSON.stringify(claims));
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(body)));

  return `${body}.${Buffer.from(signature).toString('base64url')}`;
}

function createBurstBucket() {
  let gets = 0;

  const bucket = {
    async get(key: string) {
      gets += 1;

      if (key !== `${PREFIX}/sco.html`) return null;

      return {
        body: BODY,
        size: new TextEncoder().encode(BODY).length,
        httpMetadata: { contentType: 'text/html; charset=utf-8' }
      };
    },
    async head(key: string) {
      if (key !== `${PREFIX}/sco.html`) return null;

      return { size: new TextEncoder().encode(BODY).length, httpMetadata: {} };
    }
  };

  return { bucket, reads: () => gets };
}

function createBurstCache() {
  const store = new Map<string, Response>();
  let puts = 0;

  const cache = {
    async match(key: Request): Promise<Response | undefined> {
      const hit = store.get(key.url);

      return hit ? hit.clone() : undefined;
    },
    async put(key: Request, response: Response): Promise<void> {
      puts += 1;
      store.set(key.url, response.clone());
    }
  };

  return { cache, puts: () => puts };
}

describe('activity content burst: 200 learners open one package in a minute', () => {
  let env: ActivityContentEnv;
  let bucketSetup: ReturnType<typeof createBurstBucket>;
  let cacheSetup: ReturnType<typeof createBurstCache>;
  let token: string;

  beforeEach(async () => {
    bucketSetup = createBurstBucket();
    cacheSetup = createBurstCache();
    env = {
      SCORM_BUCKET: bucketSetup.bucket as unknown as R2Bucket,
      ACTIVITY_SIGNING_SECRET: SECRET,
      SCORM_CONTENT_DOMAIN: CONTENT_DOMAIN,
      API_UPSTREAM_HOST: 'api.example.com'
    };
    vi.stubGlobal('caches', { default: cacheSetup.cache });
    token = await mintContentToken({
      org: ORG,
      p: PREFIX,
      anc: ['https://acme.myclassroomio.com'],
      wk: isoWeekIndex(new Date(NOW))
    });
  });

  it('serves the burst from the edge cache after one bucket read', async () => {
    const warm = await handleActivityContentRequest(
      new Request(`https://${HOST}/activity/content/${token}/sco.html`),
      env,
      NOW
    );

    expect(warm.status).toBe(200);
    expect(warm.headers.get('Cache-Control')).toBe(ACTIVITY_CACHE_CONTROL);
    expect(bucketSetup.reads()).toBe(1);
    expect(cacheSetup.puts()).toBe(1);

    const burst = await Promise.all(
      Array.from({ length: 200 }, () =>
        handleActivityContentRequest(new Request(`https://${HOST}/activity/content/${token}/sco.html`), env, NOW)
      )
    );

    expect(burst).toHaveLength(200);
    for (const response of burst) {
      expect(response.status).toBe(200);
      expect(await response.text()).toBe(BODY);
    }
    expect(bucketSetup.reads()).toBe(1);
    expect(cacheSetup.puts()).toBe(1);
  });

  it('keeps cache keys stable for the shared weekly token', async () => {
    const first = await handleActivityContentRequest(
      new Request(`https://${HOST}/activity/content/${token}/sco.html`),
      env,
      NOW
    );
    const second = await handleActivityContentRequest(
      new Request(`https://${HOST}/activity/content/${token}/sco.html`),
      env,
      NOW
    );

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(bucketSetup.reads()).toBe(1);
    expect(await sha256Hex(JSON.stringify(['https://acme.myclassroomio.com']))).toMatch(/^[0-9a-f]{64}$/);
  });
});
