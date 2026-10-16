import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GetObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { mintContentToken } from '@cio/activity-packages';

vi.mock('@cio/core/config/activity-content', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@cio/core/config/activity-content')>();

  return {
    ...actual,
    getActivitySigningSecret: () => 'test-activity-secret-0123456789'
  };
});

const sendMock = vi.fn();

vi.mock('@cio/core/config/storage', () => ({
  getStorageConfig: () => ({ bucketScorm: 'scorm' }),
  getS3Client: () => ({ send: sendMock })
}));

import { activityContentRouter } from '@api/routes/activity/content';
import { normalizeContentPath } from '@api/routes/activity/content';
import { Hono } from '@api/utils/hono';

const SECRET = 'test-activity-secret-0123456789';
const PREFIX = 'scorm/asset-1/v1';
const ORG = 'org-1';
const ANC = ['https://app.test'];

function buildApp() {
  return new Hono().route('/activity/content', activityContentRouter);
}

function contentRequest(app: ReturnType<typeof buildApp>, token: string, path: string, init?: RequestInit) {
  return app.request(`/activity/content/${token}/${path}`, {
    ...init,
    headers: { host: 'content.localhost', ...(init?.headers ?? {}) }
  });
}

function s3Body(text: string) {
  return {
    transformToString: async () => text,
    [Symbol.asyncIterator]: async function* () {
      yield new TextEncoder().encode(text);
    }
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('normalizeContentPath', () => {
  it('rejects traversal and absolute paths', () => {
    expect(normalizeContentPath('../secret')).toBeNull();
    expect(normalizeContentPath('a/../../b')).toBeNull();
    expect(normalizeContentPath('/absolute')).toBeNull();
    expect(normalizeContentPath('C:/windows')).toBeNull();
    expect(normalizeContentPath('')).toBeNull();
    expect(normalizeContentPath('sco.html')).toBe('sco.html');
    expect(normalizeContentPath('a/./b.html')).toBe('a/b.html');
  });
});

describe('content token gate', () => {
  it('returns 404 off the content host', async () => {
    const app = buildApp();
    const token = await mintContentToken({ org: ORG, prefix: PREFIX, anc: ANC }, SECRET);

    const response = await app.request(`/activity/content/${token}/sco.html`, {
      headers: { host: 'app.test' }
    });

    expect(response.status).toBe(404);
    expect(sendMock).not.toHaveBeenCalled();
  });

  it('rejects forged tokens with 401', async () => {
    const app = buildApp();

    const response = await contentRequest(app, 'forged.token', 'sco.html');

    expect(response.status).toBe(401);
  });

  it('rejects expired week tokens with 401', async () => {
    const app = buildApp();
    const oldMs = Date.now() - 21 * 24 * 60 * 60 * 1000;
    const token = await mintContentToken({ org: ORG, prefix: PREFIX, anc: ANC }, SECRET, oldMs);

    sendMock.mockResolvedValue({ Body: s3Body('x'), ContentType: 'text/html', ContentLength: 1 });

    const response = await contentRequest(app, token, 'sco.html');

    expect(response.status).toBe(401);
  });

  it('accepts last week rollover tokens', async () => {
    const app = buildApp();
    const lastWeekMs = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const token = await mintContentToken({ org: ORG, prefix: PREFIX, anc: ANC }, SECRET, lastWeekMs);

    sendMock.mockImplementation((command: unknown) => {
      if (command instanceof GetObjectCommand) {
        return Promise.resolve({
          Body: new ReadableStream({
            start(controller) {
              controller.enqueue(new TextEncoder().encode('<html></html>'));
              controller.close();
            }
          }),
          ContentType: 'text/html; charset=utf-8',
          ContentLength: 13
        });
      }

      return Promise.reject(new Error('unexpected'));
    });

    const response = await contentRequest(app, token, 'sco.html');

    expect(response.status).toBe(200);
  });
});

describe('content serving', () => {
  it('serves files with immutable cache headers and no X-Frame-Options', async () => {
    const app = buildApp();
    const token = await mintContentToken({ org: ORG, prefix: PREFIX, anc: ANC }, SECRET);

    sendMock.mockImplementation((command: unknown) => {
      if (command instanceof GetObjectCommand) {
        return Promise.resolve({
          Body: new ReadableStream({
            start(controller) {
              controller.enqueue(new TextEncoder().encode('<html></html>'));
              controller.close();
            }
          }),
          ContentType: 'text/html; charset=utf-8',
          ContentLength: 13
        });
      }

      return Promise.reject(new Error('unexpected'));
    });

    const response = await contentRequest(app, token, 'sco.html');

    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toBe('public, max-age=604800, immutable');
    expect(response.headers.get('Content-Type')).toContain('text/html');
    expect(response.headers.get('X-Frame-Options')).toBeNull();
    expect(response.headers.get('Content-Security-Policy')).toContain('frame-ancestors');
    expect(response.headers.get('Content-Security-Policy')).toContain('https://app.test');
    expect(response.headers.get('Cross-Origin-Opener-Policy')).toBe('unsafe-none');
    expect(response.headers.get('Referrer-Policy')).toBe('strict-origin');
    expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
    expect(response.headers.get('Cross-Origin-Resource-Policy')).toBe('cross-origin');

    const sentKey = (sendMock.mock.calls[0][0] as GetObjectCommand).input.Key;
    expect(sentKey).toBe(`${PREFIX}/sco.html`);
  });

  it('rejects path traversal with 404', async () => {
    const app = buildApp();
    const token = await mintContentToken({ org: ORG, prefix: PREFIX, anc: ANC }, SECRET);

    const response = await contentRequest(app, token, '..%2Fother%2Fsco.html');

    expect(response.status).toBe(404);
    expect(sendMock).not.toHaveBeenCalled();
  });

  it('supports Range requests with 206', async () => {
    const app = buildApp();
    const token = await mintContentToken({ org: ORG, prefix: PREFIX, anc: ANC }, SECRET);

    sendMock.mockImplementation((command: unknown) => {
      if (command instanceof GetObjectCommand) {
        const input = (command as GetObjectCommand).input;

        if (input.Range !== 'bytes=0-3') {
          return Promise.reject(new Error(`unexpected range ${input.Range}`));
        }

        return Promise.resolve({
          Body: new ReadableStream({
            start(controller) {
              controller.enqueue(new TextEncoder().encode('abcd'));
              controller.close();
            }
          }),
          ContentType: 'video/mp4',
          ContentLength: 4,
          ContentRange: 'bytes 0-3/100'
        });
      }

      return Promise.reject(new Error('unexpected'));
    });

    const response = await contentRequest(app, token, 'video.mp4', { headers: { range: 'bytes=0-3' } });

    expect(response.status).toBe(206);
    expect(response.headers.get('Content-Range')).toBe('bytes 0-3/100');
    expect(response.headers.get('Accept-Ranges')).toBe('bytes');
  });

  it('rejects malformed Range with 416', async () => {
    const app = buildApp();
    const token = await mintContentToken({ org: ORG, prefix: PREFIX, anc: ANC }, SECRET);

    const response = await contentRequest(app, token, 'video.mp4', { headers: { range: 'bytes=abc' } });

    expect(response.status).toBe(416);
    expect(sendMock).not.toHaveBeenCalled();
  });

  it('falls back to a case-insensitive index match', async () => {
    const app = buildApp();
    const token = await mintContentToken({ org: ORG, prefix: PREFIX, anc: ANC }, SECRET);
    const missing = Object.assign(new Error('missing'), { name: 'NoSuchKey' });

    sendMock.mockImplementation((command: unknown) => {
      if (!(command instanceof GetObjectCommand)) return Promise.reject(new Error('unexpected'));

      const key = (command as GetObjectCommand).input.Key;

      if (key === `${PREFIX}/SCO.HTML`) return Promise.reject(missing);
      if (key === `${PREFIX}/index.json`) {
        return Promise.resolve({ Body: s3Body(JSON.stringify(['sco.html'])) });
      }
      if (key === `${PREFIX}/sco.html`) {
        return Promise.resolve({
          Body: new ReadableStream({
            start(controller) {
              controller.enqueue(new TextEncoder().encode('<html></html>'));
              controller.close();
            }
          }),
          ContentType: 'text/html; charset=utf-8',
          ContentLength: 13
        });
      }

      return Promise.reject(missing);
    });

    const response = await contentRequest(app, token, 'SCO.HTML');

    expect(response.status).toBe(200);
  });

  it('answers HEAD with length and cache headers', async () => {
    const app = buildApp();
    const token = await mintContentToken({ org: ORG, prefix: PREFIX, anc: ANC }, SECRET);

    sendMock.mockImplementation((command: unknown) => {
      if (command instanceof HeadObjectCommand) {
        return Promise.resolve({ ContentLength: 42, ContentType: 'video/mp4' });
      }

      return Promise.reject(new Error('unexpected'));
    });

    const response = await contentRequest(app, token, 'video.mp4', { method: 'HEAD' });

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Length')).toBe('42');
    expect(response.headers.get('Cache-Control')).toBe('public, max-age=604800, immutable');
  });
});
