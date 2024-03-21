import { LEMON_SQUEEZY_API_KEY } from '$env/static/private';
import { lemonSqueezySetup } from '@lemonsqueezy/lemonsqueezy.js';

export function configureLemonSqueezy() {
  return lemonSqueezySetup({
    apiKey: LEMON_SQUEEZY_API_KEY,
    onError: (error) => {
      throw new Error(`Lemon Squeezy API error: ${error.message}`);
    }
  });
}
