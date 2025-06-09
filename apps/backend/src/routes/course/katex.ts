import { Context, Hono } from 'hono';

import katex from 'katex';
import { z } from 'zod';

export const katexRouter = new Hono();

const katexSchema = z.object({
  latex: z.string().min(1),
  displayMode: z.boolean().optional()
});

katexRouter.post('/', async (c: Context) => {
  try {
    const data = await c.req.json();
    const validatedData = katexSchema.parse(data);

    const html = katex.renderToString(validatedData.latex, {
      displayMode: validatedData.displayMode ?? false,
      throwOnError: false
    });

    return c.json({
      success: true,
      html
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json(
        {
          success: false,
          error: 'Validation error',
          details: error.errors
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
