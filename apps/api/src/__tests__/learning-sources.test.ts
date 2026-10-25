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
    redis.incr.mockReset();
    redis.incr.mockResolvedValue(1);
    redis.expire.mockReset();
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
    expect(redis.incr.mock.calls.map(([key]) => key)).toEqual([
      expect.stringContaining(`personal-learning:search-quota:${ownerUserId}:`),
      expect.stringContaining(`personal-learning:fetch-quota:${ownerUserId}:`),
      expect.stringContaining(`personal-learning:fetch-quota:${ownerUserId}:`)
    ]);
    expect(fetchMock.mock.calls[0][1]?.headers).toMatchObject({
      Authorization: 'Bearer test-jina-key',
      Accept: 'application/json'
    });
  });

  it('rejects source pages that do not return HTTP 200', async () => {
    vi.stubEnv('JINA_API_KEY', '');
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ detail: 'Source returned HTTP 404' }), { status: 422 })
    );

    await expect(
      discoverLearningSources({
        ownerUserId,
        query: 'manual source',
        language: 'en',
        userUrls: ['https://example.com/missing']
      })
    ).rejects.toMatchObject({ code: 'NO_VERIFIABLE_SOURCE' });

    expect(fetchMock.mock.calls[0][1]?.headers).toMatchObject({ 'X-Assert-Status-Code': '200' });
  });

  it('skips an unavailable source and continues with the next verified source', async () => {
    vi.stubEnv('JINA_API_KEY', '');
    fetchMock
      .mockResolvedValueOnce(new Response(JSON.stringify({ detail: 'Source returned HTTP 404' }), { status: 422 }))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            data: {
              url: 'https://available.example/lesson',
              title: 'Available lesson',
              content: '# Available lesson\nThis page has useful source content.'
            }
          }),
          { status: 200 }
        )
      );

    const sources = await discoverLearningSources({
      ownerUserId,
      query: 'manual source',
      language: 'en',
      userUrls: ['https://missing.example/lesson', 'https://available.example/lesson']
    });

    expect(sources).toHaveLength(1);
    expect(sources[0]?.url).toBe('https://available.example/lesson');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('rejects soft-404 pages that return HTTP 200', async () => {
    vi.stubEnv('JINA_API_KEY', '');
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          data: {
            url: 'https://example.com/missing',
            title: 'Page Not Found',
            content: '# Page Not Found\nThe requested page could not be found.'
          }
        }),
        { status: 200 }
      )
    );

    await expect(
      discoverLearningSources({
        ownerUserId,
        query: 'manual source',
        language: 'en',
        userUrls: ['https://example.com/missing']
      })
    ).rejects.toMatchObject({ code: 'NO_VERIFIABLE_SOURCE' });
  });

  it('stores a safe final URL after the source redirects', async () => {
    vi.stubEnv('JINA_API_KEY', '');
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          data: {
            url: 'https://docs.example.com/current-guide',
            title: 'Current guide',
            content: '# Current guide\nVerified source content after redirect.'
          }
        }),
        { status: 200 }
      )
    );

    const sources = await discoverLearningSources({
      ownerUserId,
      query: 'manual source',
      language: 'en',
      userUrls: ['https://docs.example.com/old-guide']
    });

    expect(sources[0]).toMatchObject({
      url: 'https://docs.example.com/current-guide',
      title: 'Current guide'
    });
  });

  it('does not store a redirect whose final URL points to a private host', async () => {
    vi.stubEnv('JINA_API_KEY', '');
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          data: {
            url: 'http://127.0.0.1/admin',
            title: 'Private page',
            content: '# Private page\nThis content must not become a source.'
          }
        }),
        { status: 200 }
      )
    );

    await expect(
      discoverLearningSources({
        ownerUserId,
        query: 'manual source',
        language: 'en',
        userUrls: ['https://example.com/guide']
      })
    ).rejects.toMatchObject({ code: 'NO_VERIFIABLE_SOURCE' });
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
    redis.incr.mockResolvedValueOnce(6);

    await expect(discoverLearningSources({ ownerUserId, query: 'biology', language: 'en' })).rejects.toMatchObject({
      code: 'LEARNING_SOURCE_QUOTA_EXCEEDED'
    });
    expect(redis.incr.mock.calls[0]?.[0]).toContain(`personal-learning:search-quota:${ownerUserId}:`);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('allows the fifth daily search', async () => {
    redis.incr.mockResolvedValueOnce(5);
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ data: [] }), { status: 200, headers: { 'content-type': 'application/json' } })
    );

    await expect(discoverLearningSources({ ownerUserId, query: 'biology', language: 'en' })).rejects.toMatchObject({
      code: 'NO_VERIFIABLE_SOURCE'
    });
    expect(redis.incr.mock.calls[0]?.[0]).toContain(`personal-learning:search-quota:${ownerUserId}:`);
  });

  it('can fetch a supplied public URL without search after the search quota is exhausted', async () => {
    redis.incr.mockImplementation(async (key: string) =>
      key.includes(':search-quota:') || key.includes(':source-quota:') ? 6 : 1
    );
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ data: { content: '# Public guide\nThis source explains the topic.' } }), {
        status: 200
      })
    );

    const sources = await discoverLearningSources({
      ownerUserId,
      query: 'biology',
      language: 'en',
      userUrls: ['https://example.edu/guide']
    });

    expect(sources).toHaveLength(1);
    expect(redis.incr).toHaveBeenCalledTimes(1);
    expect(redis.incr.mock.calls[0]?.[0]).toContain(`personal-learning:fetch-quota:${ownerUserId}:`);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('enforces the independent daily fetch budget', async () => {
    vi.stubEnv('JINA_API_KEY', '');
    redis.incr.mockResolvedValueOnce(16);

    await expect(
      discoverLearningSources({
        ownerUserId,
        query: 'manual source',
        language: 'en',
        userUrls: ['https://example.edu/guide']
      })
    ).rejects.toMatchObject({ code: 'LEARNING_SOURCE_QUOTA_EXCEEDED' });

    expect(redis.incr.mock.calls[0]?.[0]).toContain(`personal-learning:fetch-quota:${ownerUserId}:`);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('allows the fifteenth daily fetch', async () => {
    vi.stubEnv('JINA_API_KEY', '');
    redis.incr.mockResolvedValueOnce(15);
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ data: { content: '# Public guide\nVerified source material.' } }), { status: 200 })
    );

    const sources = await discoverLearningSources({
      ownerUserId,
      query: 'manual source',
      language: 'en',
      userUrls: ['https://example.edu/guide']
    });

    expect(sources).toHaveLength(1);
    expect(redis.incr.mock.calls[0]?.[0]).toContain(`personal-learning:fetch-quota:${ownerUserId}:`);
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
      {
        url: 'https://example.edu/lesson',
        title: 'Course notes',
        accessedAt: '2026-10-21T00:00:00.000Z',
        content: 'A fitted line estimates the relationship between variables.'
      }
    ];
    const draft = {
      title: 'Linear regression basics',
      objectives: ['Explain a fitted line'],
      activities: [{ type: 'reading', estimatedMinutes: 20, content: 'Read the source.' }],
      checkQuestions: ['What does the slope mean?'],
      citations: [
        {
          url: 'https://example.net/unverified',
          title: 'Unverified source',
          evidence: [
            { claimId: 'objective-1', quote: 'A fitted line estimates the relationship between variables.' },
            { claimId: 'activity-1', quote: 'A fitted line estimates the relationship between variables.' }
          ]
        }
      ],
      whyThisSession: 'Build the core concept.'
    };

    expect(() => validateSessionDraft(draft, manifest, 30)).toThrowError(
      expect.objectContaining({ code: 'UNKNOWN_CITATION' })
    );
    expect(() =>
      validateSessionDraft({ ...draft, citations: [{ ...draft.citations[0], url: manifest[0].url }] }, manifest, 15)
    ).toThrowError(expect.objectContaining({ code: 'DAILY_BUDGET_EXCEEDED' }));
  });

  it('requires citation evidence to match a generated claim and its verified source', () => {
    const manifest = [
      {
        url: 'https://example.edu/lesson',
        title: 'Exposure triangle',
        accessedAt: '2026-10-21T00:00:00.000Z',
        content: 'Exposure balances aperture,\nshutter speed, and ISO.'
      }
    ];
    const draft = {
      title: 'Exposure triangle',
      objectives: ['Explain exposure controls'],
      activities: [{ type: 'reading', estimatedMinutes: 20, content: 'Compare the settings.' }],
      checkQuestions: ['Which settings affect exposure?'],
      citations: [
        {
          url: manifest[0].url,
          title: manifest[0].title,
          evidence: [
            { claimId: 'objective-1', quote: 'aperture, shutter speed, and ISO.' },
            { claimId: 'activity-1', quote: 'Exposure balances aperture, shutter speed, and ISO.' }
          ]
        }
      ],
      whyThisSession: 'Build the core concept.'
    };

    expect(validateSessionDraft(draft, manifest, 30)).toEqual(draft);
    expect(
      validateSessionDraft(
        { ...draft, citations: [{ ...draft.citations[0], title: 'Unverified title' }] },
        manifest,
        30
      ).citations[0]?.title
    ).toBe(manifest[0].title);
    expect(() =>
      validateSessionDraft(
        {
          ...draft,
          citations: [
            {
              ...draft.citations[0],
              evidence: [{ ...draft.citations[0].evidence[0], claimId: 'objective-2' }, draft.citations[0].evidence[1]]
            }
          ]
        },
        manifest,
        30
      )
    ).toThrowError(expect.objectContaining({ code: 'INVALID_CITATION_CLAIM' }));
    expect(() =>
      validateSessionDraft(
        {
          ...draft,
          citations: [
            {
              ...draft.citations[0],
              evidence: [
                { ...draft.citations[0].evidence[0], quote: 'ISO controls the shutter.' },
                draft.citations[0].evidence[1]
              ]
            }
          ]
        },
        manifest,
        30
      )
    ).toThrowError(expect.objectContaining({ code: 'UNVERIFIED_CITATION_EVIDENCE' }));
  });

  it('rejects objectives and activities without verified citation evidence', () => {
    const manifest = [
      {
        url: 'https://example.edu/lesson',
        title: 'Exposure triangle',
        accessedAt: '2026-10-21T00:00:00.000Z',
        content: 'Exposure balances aperture, shutter speed, and ISO.'
      }
    ];
    const draft = {
      title: 'Exposure triangle',
      objectives: ['Explain exposure controls'],
      activities: [{ type: 'explanation' as const, estimatedMinutes: 20, content: 'Compare the settings.' }],
      checkQuestions: ['Which settings affect exposure?'],
      citations: [
        {
          url: manifest[0].url,
          title: manifest[0].title,
          evidence: [{ claimId: 'objective-1', quote: 'Exposure balances aperture, shutter speed, and ISO.' }]
        }
      ],
      whyThisSession: 'Build the core concept.'
    };

    expect(() => validateSessionDraft(draft, manifest, 30)).toThrowError(
      expect.objectContaining({ code: 'MISSING_CITATION_EVIDENCE' })
    );

    const draftWithUncitedObjective = {
      ...draft,
      objectives: [...draft.objectives, 'Compare camera settings'],
      citations: [
        {
          ...draft.citations[0],
          evidence: [
            ...draft.citations[0].evidence,
            { claimId: 'activity-1', quote: 'Exposure balances aperture, shutter speed, and ISO.' }
          ]
        }
      ]
    };

    expect(() => validateSessionDraft(draftWithUncitedObjective, manifest, 30)).toThrowError(
      expect.objectContaining({ code: 'MISSING_CITATION_EVIDENCE' })
    );
  });
});
