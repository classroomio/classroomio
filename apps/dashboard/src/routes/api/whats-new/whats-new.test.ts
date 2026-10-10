import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('$app/environment', () => ({ dev: false }));

import { GET } from './+server';

const request = (fetchFn: typeof fetch) => GET({ fetch: fetchFn } as unknown as Parameters<typeof GET>[0]);

describe('GET /api/whats-new', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('returns the entries from the marketing site', async () => {
    const fetchFn = vi.fn().mockResolvedValue(new Response(JSON.stringify({ entries: [{ id: 'a' }, { id: 'b' }] })));

    const response = await request(fetchFn as unknown as typeof fetch);

    expect(await response.json()).toEqual({ entries: [{ id: 'a' }, { id: 'b' }] });
    expect(fetchFn).toHaveBeenCalledWith('https://classroomio.com/api/changelog?limit=5');
  });

  it('returns an empty list when the site responds with an error', async () => {
    const fetchFn = vi.fn().mockResolvedValue(new Response('nope', { status: 500 }));

    expect(await (await request(fetchFn as unknown as typeof fetch)).json()).toEqual({ entries: [] });
  });

  it('returns an empty list when the site cannot be reached', async () => {
    const fetchFn = vi.fn().mockRejectedValue(new Error('offline'));

    expect(await (await request(fetchFn as unknown as typeof fetch)).json()).toEqual({ entries: [] });
  });
});
