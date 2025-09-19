import { Hono } from 'hono';
import { Scalar } from '@scalar/hono-api-reference';
import { env } from '$src/config/env';

export function configureOpenAPI(app: Hono) {
  if (env.OPENAPI_URL) {
    app.get('/docs', Scalar({ url: env.OPENAPI_URL, theme: 'none' }));
  }
}
