import posthog from 'posthog-js';
import { supabase } from '$lib/utils/functions/supabase';
import { capturePosthogEvent } from '$lib/utils/services/posthog';
import { currentOrg, orgs, defaultCurrentOrgState } from '$lib/utils/store/org';
import { user, profile, defaultProfileState, defaultUserState } from '$lib/utils/store/user';
import { goto } from '$app/navigation';

export async function logout(redirect = true) {
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error('Error logging out: ', error);
  }

  currentOrg.set(defaultCurrentOrgState);
  orgs.set([]);
  user.set(defaultUserState);
  profile.set(defaultProfileState);

  capturePosthogEvent('user_logged_out');
  posthog.reset();

  if (redirect) {
    goto('/login');
  }
}
