<script lang="ts">
  import posthog from 'posthog-js';
  import { goto } from '$app/navigation';
  import * as Command from '@cio/ui/base/command';
  import LogOutIcon from '@lucide/svelte/icons/log-out';

  import { t } from '$lib/utils/functions/translations';
  import { supabase } from '$lib/utils/functions/supabase';
  import { capturePosthogEvent } from '$lib/utils/services/posthog';
  import { currentOrg, orgs, defaultCurrentOrgState } from '$lib/utils/store/org';
  import { user, profile, defaultProfileState, defaultUserState } from '$lib/utils/store/user';

  async function logout() {
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

    goto('/login');
  }
</script>

<Command.Group class="mt-3">
  <button onclick={logout} class="w-full cursor-pointer">
    <span class="flex items-center gap-2">
      <LogOutIcon size={16} />
      <p class="text-sm">{$t('settings.profile.logout')}</p>
    </span>
  </button>
</Command.Group>
