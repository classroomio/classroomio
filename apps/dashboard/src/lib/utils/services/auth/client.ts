import { createAuthClient } from 'better-auth/svelte';
import { env } from '$env/dynamic/public';

export const authClient = createAuthClient({
  baseURL: env.PUBLIC_SERVER_URL,
  fetchOptions: {
    credentials: 'include' // Include cookies in requests
  }
});
