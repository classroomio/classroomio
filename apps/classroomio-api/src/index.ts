import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { secureHeaders } from 'hono/secure-headers';
import coursesHandler from './handlers/courses';
import keyHandler from './handlers/key';
import { swaggerUI } from '@hono/swagger-ui';

const app = new Hono();

app.use('*', secureHeaders());
app.use('*', cors({ origin: '*' }));
app.use('*', logger());
app.route('/api/v1/course', coursesHandler);
app.route('/api/v1/key', keyHandler);
app.get('/doc', swaggerUI({ url: '/doc' }));

app.notFound((c) => {
  return c.text('Resources not found', 404);
});
app.onError((err, c) => {
  console.error(`${err}`);
  return c.text('Internal server error', 500);
});

export default app;
