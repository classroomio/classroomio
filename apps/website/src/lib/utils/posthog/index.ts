import { PostHog } from 'posthog-node';

export const client = new PostHog(
  'phc_JfdHOZ6v0cVlGELBYx1Tmoen2nxNOrAzvgvrPA6Ksov',

  { host: 'https://app.posthog.com' }
);

await client.shutdownAsync();
