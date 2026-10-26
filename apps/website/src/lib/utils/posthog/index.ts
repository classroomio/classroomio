import { PostHog } from 'posthog-node';
import { POSTHOG_HOST, POSTHOG_KEY } from './constants';

// Workers can stop right after the response, so send each event straight away instead of batching.
export const client = new PostHog(POSTHOG_KEY, { host: POSTHOG_HOST, flushAt: 1, flushInterval: 0 });
