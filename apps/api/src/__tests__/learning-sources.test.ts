import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { redis, lookup } = vi.hoisted(() => ({
  redis: { isReady: true, incr: vi.fn(), expire: vi.fn() },
  lookup: vi.fn()
}));

vi.mock('@cio/core/utils/redis/redis', () => ({ redis }));
vi.mock('node:dns/promises', () => ({ lookup }));

import { discoverLearningSources } from '@api/services/learning/source-discovery';
import { validateSourceUrl, validateSessionDraft } from '@api/services/learning/source-validation';

const ownerUserId = 'b52f9231-c429-49ab-b946-2bd765b2ca99';
const fetchMock = vi.fn();

describe('personal learning sources', () => {
  beforeEach(() => {
    redis.isReady = true;
    redis.incr.mockResolvedValue(1);
    redis.expire.mockResolvedValue(1);
    lookup.mockReset();
    lookup.mockResolvedValue([{ address: '93.184.216.34', family: 4 }]);
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
    vi.stubEnv('JINA_API_KEY', 'test-jina-key');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it('prefers official sources and keeps verified source content with provenance', async () => {
    fetchMock
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            data: [
              { title: 'Personal blog', url: 'https://blog.example.com/linear-regression' },
              { title: 'University course notes', url: 'https://math.example.edu/linear-regression' }
            ]
          }),
          { status: 200, headers: { 'content-type': 'application/json' } }
        )
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ data: { content: '# University notes\nVerified source text.' } }), {
          status: 200
        })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ data: { content: '# Blog\nSupporting source text.' } }), { status: 200 })
      );

    const sources = await discoverLearningSources({
      ownerUserId,
      query: 'linear regression basics',
      language: 'en'
    });

    expect(sources[0]).toMatchObject({
      url: 'https://math.example.edu/linear-regression',
      title: 'University course notes',
      content: '# University notes\nVerified source text.'
    });
    expect(sources).toHaveLength(2);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls[0][1]?.headers).toMatchObject({
      Authorization: 'Bearer test-jina-key',
      Accept: 'application/json'
    });
  });

  it('accepts a public URL and blocks private IPs before making requests', async () => {
    expect(validateSourceUrl('https://example.com/lesson').href).toBe('https://example.com/lesson');
    expect(() => validateSourceUrl('http://10.2.3.4/secret')).toThrowError(
      expect.objectContaining({
        code: 'INVALID_SOURCE_URL'
      })
    );

    await expect(
      discoverLearningSources({
        ownerUserId,
        query: 'private source',
        language: 'en',
        userUrls: ['http://127.0.0.1/admin']
      })
    ).rejects.toMatchObject({ code: 'INVALID_SOURCE_URL' });
    expect(fetchMock).not.toHaveBeenCalled();

    lookup.mockResolvedValueOnce([{ address: '10.0.0.8', family: 4 }]);
    await expect(
      discoverLearningSources({
        ownerUserId,
        query: 'private source',
        language: 'en',
        userUrls: ['https://example.com/lesson']
      })
    ).rejects.toMatchObject({ code: 'UNSAFE_SOURCE_HOST' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('does not follow reader redirects and maps request timeouts to a stable error', async () => {
    vi.stubEnv('JINA_API_KEY', '');
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 302, headers: { location: 'http://127.0.0.1/' } }));
    await expect(
      discoverLearningSources({
        ownerUserId,
        query: 'manual source',
        language: 'en',
        userUrls: ['https://example.com/guide']
      })
    ).rejects.toMatchObject({ code: 'UNSAFE_SOURCE_REDIRECT' });
    expect(fetchMock.mock.calls[0][1]?.redirect).toBe('manual');

    fetchMock.mockReset();
    fetchMock.mockRejectedValueOnce(new DOMException('The operation timed out', 'TimeoutError'));
    await expect(
      discoverLearningSources({
        ownerUserId,
        query: 'manual source',
        language: 'en',
        userUrls: ['https://example.com/guide']
      })
    ).rejects.toMatchObject({ code: 'LEARNING_SOURCE_TIMEOUT' });
  });

  it('fails closed when the per-user daily source quota is exhausted', async () => {
    redis.incr.mockResolvedValueOnce(10_000);

    await expect(discoverLearningSources({ ownerUserId, query: 'biology', language: 'en' })).rejects.toMatchObject({
      code: 'LEARNING_SOURCE_QUOTA_EXCEEDED'
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('returns NO_VERIFIABLE_SOURCE when search is unavailable and the learner supplied no URL', async () => {
    vi.stubEnv('JINA_API_KEY', '');

    await expect(discoverLearningSources({ ownerUserId, query: 'biology', language: 'en' })).rejects.toMatchObject({
      code: 'NO_VERIFIABLE_SOURCE'
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects unknown citations and activities above the selected daily-minute budget', () => {
    const manifest = [
      { url: 'https://example.edu/lesson', title: 'Course notes', accessedAt: '2026-10-21T00:00:00.000Z' }
    ];
    const draft = {
      title: 'Linear regression basics',
      objectives: ['Explain a fitted line'],
      activities: [{ type: 'reading', estimatedMinutes: 20, content: 'Read the source.' }],
      checkQuestions: ['What does the slope mean?'],
      citations: [{ url: 'https://example.net/unverified', title: 'Unverified source', claimIds: ['objective-1'] }],
      whyThisSession: 'Build the core concept.'
    };

    expect(() => validateSessionDraft(draft, manifest, 30)).toThrowError(
      expect.objectContaining({ code: 'UNKNOWN_CITATION' })
    );
    expect(() =>
      validateSessionDraft({ ...draft, citations: [{ ...draft.citations[0], url: manifest[0].url }] }, manifest, 15)
    ).toThrowError(expect.objectContaining({ code: 'DAILY_BUDGET_EXCEEDED' }));
  });
});
