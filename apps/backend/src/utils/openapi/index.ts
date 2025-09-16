import { Hono } from 'hono';
import { Scalar } from '@scalar/hono-api-reference';
import { openAPIRouteHandler } from 'hono-openapi';

export function configureOpenAPI(app: Hono) {
  app.get('/docs', Scalar({ url: '/openapi', theme: 'none' }));
  app.get(
    '/openapi',
    openAPIRouteHandler(app, {
      documentation: {
        info: {
          title: 'ClassroomIO API',
          version: '1.0.0',
          description: 'Manage your organization on classroomio via the API'
        }
      }
    })
  );
}
