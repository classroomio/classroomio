import { Hono } from '@api/utils/hono';
import { env } from '@api/config/env';
import { handleError } from '@api/utils/errors';
import { z } from 'zod';

const ZUnsplashRequest = z.object({
  searchQuery: z.string().optional()
});

export const unsplashRouter = new Hono()
  /**
   * POST /unsplash
   * Fetches photos from Unsplash API
   * No authentication required - public route
   */
  .post('/', async (c) => {
    try {
      const body = await c.req.json();
      const validatedData = ZUnsplashRequest.parse(body);

      const query = validatedData.searchQuery || 'rocks';
      const UNSPLASH_API_URL = `https://api.unsplash.com/search/photos?page=2&per_page=15&auto=format&fit=crop&w=2970&q=80&client_id=${env.UNSPLASH_API_KEY}`;

      const response = await fetch(`${UNSPLASH_API_URL}&query=${encodeURIComponent(query)}`, {
        method: 'GET'
      });

      if (!response.ok) {
        throw new Error('Unable to fetch photos from Unsplash API');
      }

      const data = await response.json();

      return c.json({
        success: true,
        photos: data.results
      });
    } catch (error) {
      console.error('Error fetching photos from Unsplash', error);
      return handleError(c, error, 'Error fetching photos from Unsplash');
    }
  });
