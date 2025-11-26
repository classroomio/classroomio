import { appInitApi } from '$lib/features/app/init.svelte';
import { authClient } from '$lib/utils/services/auth/client';
import { capturePosthogEvent } from '$lib/utils/services/posthog';
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

  if (redirect) {
    goto(resolve('/login', {}));
  }
}
