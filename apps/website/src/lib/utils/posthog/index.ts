import { PostHog } from 'posthog-node';
import { POSTHOG_HOST, POSTHOG_KEY } from './constants';

export const client = new PostHog(POSTHOG_KEY, { host: POSTHOG_HOST });

await client.shutdownAsync();
