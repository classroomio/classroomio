import { appInitApi } from '$features/app/init.svelte';
import { authClient } from '$lib/utils/services/auth/client';
import { capturePosthogEvent } from '$lib/utils/services/posthog';
import { clearSentryUser } from '$lib/utils/services/sentry';
import { clearUserJotUser } from '$lib/utils/services/userjot';
import { goto } from '$app/navigation';
import posthog from 'posthog-js';
import { resolve } from '$app/paths';

export async function logout(redirect = true) {
  const { error } = await authClient.signOut();

  if (error) {
    console.error('Error logging out: ', error);
  }

  appInitApi.reset();

  capturePosthogEvent('user_logged_out');
  posthog.reset();
  clearSentryUser();
  clearUserJotUser();

  if (redirect) {
    goto(resolve('/login', {}));
  }
}
