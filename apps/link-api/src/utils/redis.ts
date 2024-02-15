import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis/cloudflare';

type Config = {
  url: string;
  token: string;
  telemetry: string;
};

function getRateLimiter(config: Config) {
  const rateLimiter = new Ratelimit({
    redis: Redis.fromEnv({
      UPSTASH_REDIS_REST_URL: config.url,
      UPSTASH_REDIS_REST_TOKEN: config.token,
      UPSTASH_DISABLE_TELEMETRY: config.telemetry
    }),
    limiter: Ratelimit.slidingWindow(10, '10 s')
  });
  return rateLimiter;
}

export { getRateLimiter };
