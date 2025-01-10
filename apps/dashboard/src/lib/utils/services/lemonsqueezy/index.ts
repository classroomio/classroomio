import { env } from '$env/dynamic/private';
import { lemonSqueezySetup } from '@lemonsqueezy/lemonsqueezy.js';

export function configureLemonSqueezy() {
  return lemonSqueezySetup({
    apiKey: env.LEMON_SQUEEZY_API_KEY,
    onError: (error) => {
      throw new Error(`Lemon Squeezy API error: ${error.message}`);
    }
  });
}
