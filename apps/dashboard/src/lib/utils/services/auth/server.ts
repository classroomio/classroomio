import { createAuthClient } from 'better-auth/svelte';
import { getRequestBaseUrl } from '$lib/utils/services/api';

const baseURL = getRequestBaseUrl();
export const authServerClient = createAuthClient({
  baseURL,
  fetchOptions: {
    credentials: 'include' // Include cookies in requests
  }
});
console.log('baseURL', baseURL);
console.log('authServerClient', authServerClient);
