import { describe, it, expect, vi } from 'vitest';
import { load } from '../../routes/+page.server';

describe('+page.server load function', () => {
  const mockData = {
    courses: [
      {
        data: {
          title: 'Test Course',
          description: 'Test Description',
          banner: '/test-banner.jpg',
          created_at: '2024-03-20',
          cost: 0,
          currency: 'USD',
          type: 'self paced'
        },
        lessons: 5
      }
    ]
  };

  it('loads data successfully', async () => {
    // Mock fetch function
    const mockFetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockData)
      })
    );

    const result = await load({ fetch: mockFetch });

    expect(mockFetch).toHaveBeenCalledWith('/api/courses');
    expect(result.courses).toEqual(mockData.courses);
  });

  it('throws error when fetch fails', async () => {
    // Mock fetch function that fails
    const mockFetch = vi.fn(() =>
      Promise.resolve({
        ok: false
      })
    );

    await expect(load({ fetch: mockFetch })).rejects.toThrow('Failed to load courses data');
  });
});
