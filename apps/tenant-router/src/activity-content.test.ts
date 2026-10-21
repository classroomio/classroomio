import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ACTIVITY_CACHE_CONTROL,
  activityContentHeaders,
  activityIndexKeys,
  buildActivityCacheKey,
  contentTypeForActivityFile,
  findActivityCaseInsensitiveMatch,
  forwardActivityToApiUpstream,
  handleActivityContentRequest,
  hostnameFromHost,
  isActivityContentPath,
  isActivityPlayerOrRuntimePath,
  isContentHost,
  isoWeekIndex,
  normalizeActivityContentPath,
  orgKeyFromContentHost,
  sha256Hex,
  verifyActivityContentToken,
  type ActivityContentEnv
} from './activity-content';

const SECRET = 'test-secret-'.repeat(4);
const CONTENT_DOMAIN = 'classroomio-content.com';
const HOST = 'k7f3q2.classroomio-content.com';
const ORG = 'k7f3q2';
const PREFIX = 'scorm/asset-1/v1';
const NOW = Date.UTC(2026, 9, 9, 12, 0, 0);

function base64UrlEncode(input: string): string {
  return Buffer.from(input, 'utf8').toString('base64url');
}

async function mintTestToken(
  claims: { org: string; p: string; anc: string[]; wk: number },
  secret: string = SECRET
): Promise<string> {
  const body = base64UrlEncode(JSON.stringify(claims));
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(body)));
  const encoded = Buffer.from(signature).toString('base64url');

  return `${body}.${encoded}`;
}

async function currentWeekToken(anc: string[] = ['https://acme.myclassroomio.com']): Promise<string> {
  return mintTestToken({ org: ORG, p: PREFIX, anc, wk: isoWeekIndex(new Date(NOW)) });
}

interface MockFile {
  body: string;
  contentType?: string;
}

function byteLength(value: string): number {
  return new TextEncoder().encode(value).length;
}

function createMockBucket(initial: Record<string, MockFile> = {}) {
  const files = new Map(Object.entries(initial));
  const calls = { get: 0, head: 0 };

  const bucket = {
    async get(key: string, options?: { range?: { offset: number; length?: number } }) {
      calls.get += 1;
      const file = files.get(key);

      if (!file) return null;

      let body = file.body;

      if (options?.range) {
        const bytes = new TextEncoder().encode(file.body);
        const end = options.range.length == null ? bytes.length : options.range.offset + options.range.length;
        body = new TextDecoder().decode(bytes.slice(options.range.offset, end));
      }

      return {
        body,
        size: byteLength(file.body),
        httpMetadata: file.contentType ? { contentType: file.contentType } : {},
        async json() {
          return JSON.parse(body) as unknown;
        }
      };
    },
    async head(key: string) {
      calls.head += 1;
      const file = files.get(key);

      if (!file) return null;

      return {
        size: byteLength(file.body),
        httpMetadata: file.contentType ? { contentType: file.contentType } : {}
      };
    }
  };

  return { bucket, calls, files };
}

function createMockCache() {
  const store = new Map<string, Response>();
  const calls = { match: 0, put: 0 };

  const cache = {
    async match(key: Request): Promise<Response | undefined> {
      calls.match += 1;
      const hit = store.get(key.url);

      return hit ? hit.clone() : undefined;
    },
    async put(key: Request, response: Response): Promise<void> {
      calls.put += 1;
      store.set(key.url, response.clone());
    }
  };

  return { cache, calls, store };
}

function contentRequest(path: string, init?: RequestInit): Request {
  return new Request(`https://${HOST}${path}`, init);
}

describe('content host helpers', () => {
  it('detects content subdomains and extracts the org key', () => {
    expect(isContentHost(HOST, CONTENT_DOMAIN)).toBe(true);
    expect(isContentHost(CONTENT_DOMAIN, CONTENT_DOMAIN)).toBe(false);
    expect(isContentHost('app.classroomio.com', CONTENT_DOMAIN)).toBe(false);
    expect(orgKeyFromContentHost(HOST, CONTENT_DOMAIN)).toBe(ORG);
    expect(orgKeyFromContentHost(CONTENT_DOMAIN, CONTENT_DOMAIN)).toBeNull();
    expect(hostnameFromHost('K7F3Q2.Classroomio-Content.com:443')).toBe(HOST);
  });

  it('classifies activity paths', () => {
    expect(isActivityContentPath('/activity/content/abc/file.html')).toBe(true);
    expect(isActivityContentPath('/activity/player/token')).toBe(false);
    expect(isActivityPlayerOrRuntimePath('/activity/player/token')).toBe(true);
    expect(isActivityPlayerOrRuntimePath('/activity/player-assets/app.js')).toBe(true);
    expect(isActivityPlayerOrRuntimePath('/activity/scorm/runtime/token/state')).toBe(true);
    expect(isActivityPlayerOrRuntimePath('/activity/content/token/file')).toBe(false);
  });

  it('normalizes paths and rejects traversal', () => {
    expect(normalizeActivityContentPath('sco.html')).toBe('sco.html');
    expect(normalizeActivityContentPath('dir//sco.html')).toBe('dir/sco.html');
    expect(normalizeActivityContentPath('dir\\.\\sco.html')).toBe('dir/sco.html');
    expect(normalizeActivityContentPath('../secret.txt')).toBeNull();
    expect(normalizeActivityContentPath('a/../../b')).toBeNull();
    expect(normalizeActivityContentPath('/etc/passwd')).toBeNull();
    expect(normalizeActivityContentPath('C:/windows/file')).toBeNull();
    expect(normalizeActivityContentPath('%2e%2e%2fsecret.txt')).toBeNull();
    expect(normalizeActivityContentPath('')).toBeNull();
  });

  it('resolves stored content types with a byte fallback', () => {
    expect(contentTypeForActivityFile('sco.html')).toBe('text/html; charset=utf-8');
    expect(contentTypeForActivityFile('app.JS')).toBe('text/javascript; charset=utf-8');
    expect(contentTypeForActivityFile('movie.mp4')).toBe('video/mp4');
    expect(contentTypeForActivityFile('no-extension')).toBe('application/octet-stream');
  });

  it('finds case-insensitive matches with exact priority', () => {
    expect(findActivityCaseInsensitiveMatch('sco.html', ['SCO.HTML', 'sco.html'])).toBe('sco.html');
    expect(findActivityCaseInsensitiveMatch('Images/Logo.PNG', ['images/logo.png'])).toBe('images/logo.png');
    expect(findActivityCaseInsensitiveMatch('missing.html', ['sco.html'])).toBeNull();
  });

  it('names both index candidates', () => {
    expect(activityIndexKeys(PREFIX)).toEqual([`${PREFIX}/index.json`, `${PREFIX}.index.json`]);
  });

  it('builds security headers without frame options', () => {
    const headers = activityContentHeaders('text/html; charset=utf-8', ['https://acme.myclassroomio.com']);

    expect(headers.get('Cache-Control')).toBe(ACTIVITY_CACHE_CONTROL);
    expect(headers.get('Content-Security-Policy')).toBe("frame-ancestors 'self' https://acme.myclassroomio.com");
    expect(headers.get('Cross-Origin-Opener-Policy')).toBe('unsafe-none');
    expect(headers.get('Referrer-Policy')).toBe('strict-origin');
    expect(headers.get('X-Content-Type-Options')).toBe('nosniff');
    expect(headers.get('Cross-Origin-Resource-Policy')).toBe('cross-origin');
    expect(headers.get('X-Frame-Options')).toBeNull();
  });

  it('hashes ancestors deterministically', async () => {
    const first = await sha256Hex(JSON.stringify(['a', 'b']));
    const second = await sha256Hex(JSON.stringify(['a', 'b']));

    expect(first).toBe(second);
    expect(first).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe('content tokens', () => {
  it('accepts the mint week and the week after', async () => {
    const week = isoWeekIndex(new Date(NOW));
    const token = await mintTestToken({ org: ORG, p: PREFIX, anc: [], wk: week });

    expect((await verifyActivityContentToken(token, SECRET, ORG, NOW)).wk).toBe(week);
    expect(await verifyActivityContentToken(token, SECRET, ORG, NOW + 7 * 24 * 3600_000)).toBeTruthy();
  });

  it('rejects forged tokens before any scope check', async () => {
    const token = await currentWeekToken();
    const [body, signature] = token.split('.');

    for (const bad of [
      `${body}.x${signature.slice(1)}`,
      'nope',
      await mintTestToken({ org: ORG, p: PREFIX, anc: [], wk: isoWeekIndex(new Date(NOW)) }, 'other-secret-'.repeat(4))
    ]) {
      await expect(verifyActivityContentToken(bad, SECRET, ORG, NOW)).rejects.toMatchObject({ status: 401 });
    }
  });

  it('rejects tokens minted two weeks ago', async () => {
    const week = isoWeekIndex(new Date(NOW));
    const token = await mintTestToken({ org: ORG, p: PREFIX, anc: [], wk: week });

    await expect(verifyActivityContentToken(token, SECRET, ORG, NOW + 14 * 24 * 3600_000)).rejects.toMatchObject({
      status: 401
    });
  });

  it('rejects another organization with forbidden', async () => {
    const token = await currentWeekToken();

    await expect(verifyActivityContentToken(token, SECRET, 'other-org', NOW)).rejects.toMatchObject({
      status: 403
    });
  });

  it('survives the year boundary', async () => {
    const yearEnd = Date.UTC(2026, 11, 28, 12);
    const newYear = Date.UTC(2027, 0, 3, 12);
    const token = await mintTestToken({ org: ORG, p: PREFIX, anc: [], wk: isoWeekIndex(new Date(yearEnd)) });

    await expect(verifyActivityContentToken(token, SECRET, ORG, newYear)).resolves.toBeTruthy();
  });
});

describe('activity content handler', () => {
  let bucketSetup: ReturnType<typeof createMockBucket>;
  let cacheSetup: ReturnType<typeof createMockCache>;
  let env: ActivityContentEnv;

  beforeEach(() => {
    bucketSetup = createMockBucket({
      [`${PREFIX}/sco.html`]: { body: '<html>sco</html>', contentType: 'text/html; charset=utf-8' },
      [`${PREFIX}/movie.mp4`]: { body: '0123456789abcdef' }
    });
    cacheSetup = createMockCache();
    env = {
      SCORM_BUCKET: bucketSetup.bucket as unknown as R2Bucket,
      ACTIVITY_SIGNING_SECRET: SECRET,
      SCORM_CONTENT_DOMAIN: CONTENT_DOMAIN,
      API_UPSTREAM_HOST: 'api.example.com'
    };
    vi.stubGlobal('caches', { default: cacheSetup.cache });
  });

  it('rejects a forged token before any cache read', async () => {
    const response = await handleActivityContentRequest(contentRequest('/activity/content/forged/sco.html'), env, NOW);

    expect(response.status).toBe(401);
    expect(cacheSetup.calls.match).toBe(0);
    expect(bucketSetup.calls.get).toBe(0);
    expect(bucketSetup.calls.head).toBe(0);
  });

  it('serves the second request from the edge cache', async () => {
    const token = await currentWeekToken();
    const path = `/activity/content/${token}/sco.html`;

    const first = await handleActivityContentRequest(contentRequest(path), env, NOW);

    expect(first.status).toBe(200);
    expect(await first.text()).toBe('<html>sco</html>');
    expect(first.headers.get('Cache-Control')).toBe(ACTIVITY_CACHE_CONTROL);
    expect(bucketSetup.calls.get).toBe(1);

    const second = await handleActivityContentRequest(contentRequest(path), env, NOW);

    expect(second.status).toBe(200);
    expect(await second.text()).toBe('<html>sco</html>');
    expect(bucketSetup.calls.get).toBe(1);
    expect(cacheSetup.calls.put).toBe(1);
  });

  it('isolates cache entries by allowed ancestors', async () => {
    const firstToken = await currentWeekToken(['https://one.example']);
    const secondToken = await currentWeekToken(['https://two.example']);

    const first = await handleActivityContentRequest(
      contentRequest(`/activity/content/${firstToken}/sco.html`),
      env,
      NOW
    );

    expect(first.status).toBe(200);
    expect(first.headers.get('Content-Security-Policy')).toContain('https://one.example');

    const second = await handleActivityContentRequest(
      contentRequest(`/activity/content/${secondToken}/sco.html`),
      env,
      NOW
    );

    expect(second.status).toBe(200);
    expect(bucketSetup.calls.get).toBe(2);

    const cacheKey = buildActivityCacheKey(
      HOST,
      `${PREFIX}/sco.html`,
      await sha256Hex(JSON.stringify(['https://one.example']))
    );

    expect(cacheSetup.store.has(cacheKey.url)).toBe(true);
  });

  it('rejects traversal with bad request', async () => {
    const token = await currentWeekToken();

    for (const bad of ['..%2Fsecret.txt', '%2e%2e%5Csecret.txt', '..%5Csecret.txt']) {
      const response = await handleActivityContentRequest(
        contentRequest(`/activity/content/${token}/${bad}`),
        env,
        NOW
      );

      expect(response.status).toBe(400);
    }
  });

  it('cannot read another prefix', async () => {
    const token = await currentWeekToken();
    const response = await handleActivityContentRequest(
      contentRequest(`/activity/content/${token}/..%2Fother%2Ffile.html`),
      env,
      NOW
    );

    expect(response.status).toBe(400);

    const missing = await handleActivityContentRequest(
      contentRequest(`/activity/content/${token}/absent.html`),
      env,
      NOW
    );

    expect(missing.status).toBe(404);
  });

  it('rejects a token from another organization', async () => {
    const token = await mintTestToken({
      org: 'other-org',
      p: PREFIX,
      anc: [],
      wk: isoWeekIndex(new Date(NOW))
    });
    const response = await handleActivityContentRequest(
      contentRequest(`/activity/content/${token}/sco.html`),
      env,
      NOW
    );

    expect(response.status).toBe(403);
  });

  it('rejects content paths off the content host', async () => {
    const token = await currentWeekToken();
    const request = new Request(`https://app.classroomio.com/activity/content/${token}/sco.html`);
    const response = await handleActivityContentRequest(request, env, NOW);

    expect(response.status).toBe(404);
  });

  it('serves ranges with partial content', async () => {
    const token = await currentWeekToken();
    const response = await handleActivityContentRequest(
      contentRequest(`/activity/content/${token}/movie.mp4`, { headers: { range: 'bytes=0-3' } }),
      env,
      NOW
    );

    expect(response.status).toBe(206);
    expect(response.headers.get('Content-Range')).toBe('bytes 0-3/16');
    expect(response.headers.get('Content-Length')).toBe('4');
    expect(await response.text()).toBe('0123');
  });

  it('answers unsatisfiable ranges with 416', async () => {
    const token = await currentWeekToken();
    const response = await handleActivityContentRequest(
      contentRequest(`/activity/content/${token}/movie.mp4`, { headers: { range: 'bytes=99-100' } }),
      env,
      NOW
    );

    expect(response.status).toBe(416);
    expect(response.headers.get('Content-Range')).toBe('bytes */16');
  });

  it('answers head with headers and no body', async () => {
    const token = await currentWeekToken();
    const response = await handleActivityContentRequest(
      contentRequest(`/activity/content/${token}/sco.html`, { method: 'HEAD' }),
      env,
      NOW
    );

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Length')).toBe(String(byteLength('<html>sco</html>')));
    expect(await response.text()).toBe('');
  });

  it('resolves case-insensitive names through the path index', async () => {
    bucketSetup.files.set(`${PREFIX}/images/logo.png`, { body: 'png-bytes' });
    bucketSetup.files.set(`${PREFIX}/index.json`, {
      body: JSON.stringify(['sco.html', 'movie.mp4', 'images/logo.png']),
      contentType: 'application/json; charset=utf-8'
    });

    const token = await currentWeekToken();
    const response = await handleActivityContentRequest(
      contentRequest(`/activity/content/${token}/IMAGES/LOGO.PNG`),
      env,
      NOW
    );

    expect(response.status).toBe(200);
    expect(await response.text()).toBe('png-bytes');
  });

  it('rejects other methods', async () => {
    const token = await currentWeekToken();
    const response = await handleActivityContentRequest(
      contentRequest(`/activity/content/${token}/sco.html`, { method: 'POST' }),
      env,
      NOW
    );

    expect(response.status).toBe(405);
  });
});

describe('activity upstream forwarding', () => {
  it('preserves the path and marks the original host', async () => {
    const seen: { url?: string; host?: string | null; forwardedHost?: string | null } = {};
    const fetchMock = vi.fn(async (url: string, init: { headers: Headers }) => {
      seen.url = url;
      seen.host = init.headers.get('host');
      seen.forwardedHost = init.headers.get('x-forwarded-host');

      return new Response('player', { status: 200 });
    });
    vi.stubGlobal('fetch', fetchMock);

    const request = new Request(`https://${HOST}/activity/player/launch-token?debug=1`);
    const response = await forwardActivityToApiUpstream(request, { API_UPSTREAM_HOST: 'api.example.com' }, HOST);

    expect(response.status).toBe(200);
    expect(seen.url).toBe('https://api.example.com/activity/player/launch-token?debug=1');
    expect(seen.host).toBe('api.example.com');
    expect(seen.forwardedHost).toBe(HOST);
  });
});
