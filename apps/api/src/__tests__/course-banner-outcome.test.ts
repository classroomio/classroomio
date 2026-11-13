import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ env: { UNSPLASH_API_KEY: 'key' as string | undefined } }));

vi.mock('@cio/core/config/env', () => ({ env: mocks.env }));
vi.mock('@cio/core/services/course/course', () => ({ updateCourse: vi.fn() }));
vi.mock('@cio/db/queries/course', () => ({
  getCourseById: vi.fn(),
  isCourseSlugTaken: vi.fn(),
  updateCourseSlug: vi.fn()
}));
vi.mock('@cio/db/queries/tag', () => ({ getCourseOrganizationId: vi.fn() }));
vi.mock('@cio/db/queries/organization', () => ({ getOrganizationById: vi.fn() }));

import { resolveCourseBanner } from '@cio/core/services/course/landing-page';

const options = { generateBannerImage: true };

describe('resolveCourseBanner', () => {
  beforeEach(() => {
    mocks.env.UNSPLASH_API_KEY = 'key';
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('uses a provided image url without calling Unsplash', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const result = await resolveCourseBanner('Safety', { bannerImageUrl: 'https://img.example.com/a.jpg' });

    expect(result).toMatchObject({ applied: true, source: 'provided' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('reports not_requested and unsplash_not_configured', async () => {
    expect((await resolveCourseBanner('Safety', {})).reason).toBe('not_requested');

    mocks.env.UNSPLASH_API_KEY = undefined;
    expect((await resolveCourseBanner('Safety', options)).reason).toBe('unsplash_not_configured');
  });

  it('reports no_image_found only when the search succeeded with no results', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ results: [] }), { status: 200 })));

    expect((await resolveCourseBanner('Safety', options)).reason).toBe('no_image_found');
  });

  it('reports lookup_failed on an HTTP failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 429 })));

    expect((await resolveCourseBanner('Safety', options)).reason).toBe('lookup_failed');
  });

  it('reports lookup_failed when the request times out', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new DOMException('timed out', 'TimeoutError')));

    expect((await resolveCourseBanner('Safety', options)).reason).toBe('lookup_failed');
  });

  it('applies a photo from a successful search and sends a timeout signal', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ results: [{ urls: { regular: 'https://images.unsplash.com/p1' } }] }), {
        status: 200
      })
    );
    vi.stubGlobal('fetch', fetchMock);

    const result = await resolveCourseBanner('Safety', options);

    expect(result).toMatchObject({ applied: true, imageUrl: 'https://images.unsplash.com/p1', source: 'unsplash' });
    expect(fetchMock.mock.calls[0]![1].signal).toBeInstanceOf(AbortSignal);
  });
});
