import { Context, Hono } from 'hono';
import { generateKey } from '../utils/helpers';
import { RateLimiter } from 'limiter';
import db from '../utils/db';

const app = new Hono();
const limiter = new RateLimiter({
  tokensPerInterval: 1,
  interval: 'second',
  fireImmediately: true
});

app.get('/generate', async (c) => {
  const remainingRequests = await limiter.removeTokens(1);
  if (remainingRequests < 1) {
    c.status(429);
    return c.json({ error: 'Too many request', code: 429 });
  }
  const key = generateKey();
  // TODO: save encrypted version to database with argon.
  /**
   * The save data should contain a reference to the user for easy verification
   */
  c.status(201);
  return c.json({ key: key });
});

app.post('/verify-key', async (c: Context) => {
  return c.text('verify key');
});
export default app;
