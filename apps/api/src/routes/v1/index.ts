import * as Sentry from '@sentry/node';

import { Hono } from '@api/utils/hono';
import { publicApiCors } from '@api/middlewares/cors';
import { ErrorCodes, handlePublicApiError } from '@api/utils/errors';
import { v1AudienceRouter } from './audience';
import { v1CoursesRouter } from './courses';

export const v1Router = new Hono()
  .use('*', publicApiCors)
  .use('*', async (c, next) => {
    try {
      await next();
    } catch (err) {
      console.error('Public API error:', err);
      Sentry.captureException(err);
      return handlePublicApiError(c, err, 'Internal Server Error', ErrorCodes.INTERNAL_ERROR);
    }
  })
  .route('/audience', v1AudienceRouter)
  .route('/courses', v1CoursesRouter);
