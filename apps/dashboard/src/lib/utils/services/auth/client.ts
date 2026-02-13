import { createAuthClient } from 'better-auth/svelte';
import { getServerUrl } from '../api';

export const authClient = createAuthClient({
  baseURL: getServerUrl(),
  fetchOptions: {
    credentials: 'include' // Include cookies in requests
  }
});
