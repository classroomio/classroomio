import { ZPublicCourseBySlugParam, ZPublicCourseItemParam } from '@cio/utils/validation/course';
import {
  getPublicCourseItemService,
  getPublicCourseTreeService,
  issuePublicHlsCookieService
} from '@api/services/course/public-course';

import { Hono } from '@api/utils/hono';
import { handleError } from '@api/utils/errors';
import { setCookie } from 'hono/cookie';
import { zValidator } from '@hono/zod-validator';

/**
 * Anonymous-safe (no auth middleware) routes that back the `(org-site)/course/[slug]`
 * surface in the dashboard. Every response returns a single typed shape per the
 * repo's single-response-shape rule; the item endpoint uses a `kind` discriminator.
 */
export const publicCourseRouter = new Hono()
  .get('/:courseSlug', zValidator('param', ZPublicCourseBySlugParam), async (c) => {
    try {
      const { courseSlug } = c.req.valid('param');
      const tree = await getPublicCourseTreeService(courseSlug);

      if (!tree) {
        return c.json(
          {
            success: false as const,
            error: 'Public course not found',
            code: 'COURSE_NOT_FOUND'
          },
          404
        );
      }

      return c.json({ success: true as const, data: tree });
    } catch (error) {
      return handleError(c, error, 'Failed to load public course');
    }
  })
  .get('/:courseSlug/item/:itemSlug', zValidator('param', ZPublicCourseItemParam), async (c) => {
    try {
      const { courseSlug, itemSlug } = c.req.valid('param');
      const item = await getPublicCourseItemService(courseSlug, itemSlug);

      if (!item) {
        return c.json(
          {
            success: false as const,
            error: 'Public course item not found',
            code: 'NOT_FOUND'
          },
          404
        );
      }

      return c.json({ success: true as const, data: item });
    } catch (error) {
      return handleError(c, error, 'Failed to load public course item');
    }
  })
  /**
   * POST /org-site/course/:courseSlug/item/:itemSlug/hls-cookie
   * Anonymous-safe. Verifies that the public lesson exposes an HLS asset
   * and mints the short-lived `cio_hls` cookie the tenant-router Worker
   * (prod) and API streaming route (local) both validate before serving
   * segments. Caller is expected to call this once per lesson page load
   * before attaching hls.js.
   */
  .post('/:courseSlug/item/:itemSlug/hls-cookie', zValidator('param', ZPublicCourseItemParam), async (c) => {
    try {
      const { courseSlug, itemSlug } = c.req.valid('param');
      const result = await issuePublicHlsCookieService(courseSlug, itemSlug);

      setCookie(c, result.cookieName, result.token, {
        path: '/',
        httpOnly: true,
        secure: true,
        // `None` (not `Lax`) so the cookie is sent on cross-site segment
        // fetches issued by hls.js — Lax is withheld on cross-site
        // subresource requests, which would 403 every segment when the
        // public site and api/stream live on different hosts.
        sameSite: 'None',
        maxAge: result.maxAgeSeconds
      });

      return c.json({ success: true as const, data: { expiresAt: result.expiresAt } });
    } catch (error) {
      return handleError(c, error, 'Failed to issue HLS cookie');
    }
  });
