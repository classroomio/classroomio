import { Context, Hono } from 'hono';

import katex from 'katex';
import { z } from 'zod';

export const katexRouter = new Hono().get('/', async (c: Context) => {
  try {
    const original = c.req.raw.url;

    const latexString = original.split('?')[1].replaceAll('&plus;', '+').replaceAll('&space;', '');

    const html = katex.renderToString(latexString, {
      output: 'mathml',
      throwOnError: false
    });

    return c.html(html);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json(
        {
          success: false,
          error: 'Validation error',
          details: error.message
        },
        400
      );
    }

    console.error('Error rendering LaTeX:', error);
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      500
    );
  }
});
