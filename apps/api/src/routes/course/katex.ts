import * as z from 'zod';

import { Hono } from '@api/utils/hono';
import { renderLatexToMathml } from '@cio/utils/math';

export const katexRouter = new Hono().get('/', async (c) => {
  try {
    const original = c.req.raw.url;

    const latexString = original.split('?')[1].replaceAll('&plus;', '+').replaceAll('&space;', '');

    const html = renderLatexToMathml(latexString);

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
        error: 'Failed to render LaTeX'
      },
      500
    );
  }
});
