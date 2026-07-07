import { generateOrgSiteOgImage, getOrgSiteOgFallbackImageUrl, normalizeOrgOgSiteName } from '@api/services/org/og';
import { Hono } from '@api/utils/hono';
import { AppError } from '@api/utils/errors';

export const orgSiteOgRouter = new Hono().get('/:siteName', async (c) => {
  try {
    const siteName = normalizeOrgOgSiteName(c.req.param('siteName'));
    const { buffer, etag } = await generateOrgSiteOgImage(siteName);
    const ifNoneMatch = c.req.header('if-none-match');

    if (ifNoneMatch === `"${etag}"`) {
      return c.body(null, 304);
    }

    c.header('Content-Type', 'image/png');
    c.header('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');
    c.header('ETag', `"${etag}"`);

    return c.body(
      new ReadableStream({
        start(controller) {
          controller.enqueue(new Uint8Array(buffer));
          controller.close();
        }
      })
    );
  } catch (error) {
    if (error instanceof AppError && error.statusCode === 404) {
      return c.redirect(getOrgSiteOgFallbackImageUrl(), 302);
    }

    console.error('Failed to generate org OG image:', error);

    return c.redirect(getOrgSiteOgFallbackImageUrl(), 302);
  }
});
