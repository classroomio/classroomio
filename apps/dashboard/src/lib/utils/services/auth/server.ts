import { createAuthClient } from 'better-auth/svelte';
import { getRequestBaseUrl } from '$lib/utils/services/api';

export const authServerClient = createAuthClient({
  baseURL: getRequestBaseUrl(),
  fetchOptions: {
    credentials: 'include' // Include cookies in requests
  }
});
