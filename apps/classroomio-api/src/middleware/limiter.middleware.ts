import type { Context, Next } from 'hono';
import { RateLimiter } from 'limiter';
import { verifyApiKey } from '../utils/helpers';

const limiter = new RateLimiter({
  tokensPerInterval: 1,
  interval: 'second',
  fireImmediately: true
});

export async function courseLimiter(c: Context, next: Next) {
  const api_key = c.req.header('c-api-key'.toLocaleLowerCase());
  if (!api_key) return c.json({ error: 'Unauthorized' }, 401);

  const remainingRequests = await limiter.removeTokens(1);

  if (remainingRequests < 1) {
    c.status(429);
    return c.json({ error: 'Too many requests', code: 429 });
  }

  //   TODO: verify key
  const verifiedKey = verifyApiKey(api_key);
  c.set('c-api-key', api_key);

  await next();
}
