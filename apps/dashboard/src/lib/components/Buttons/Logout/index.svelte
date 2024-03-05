<script lang="ts">
  import posthog from 'posthog-js';
  import { goto } from '$app/navigation';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import { VARIANTS } from '$lib/components/PrimaryButton/constants';
  import { supabase } from '$lib/utils/functions/supabase';
  import { capturePosthogEvent } from '$lib/utils/services/posthog';
  import { currentOrg, orgs, defaultCurrentOrgState } from '$lib/utils/store/org';
  import { user, profile, defaultProfileState, defaultUserState } from '$lib/utils/store/user';
  import { t } from '$lib/utils/functions/translations';

  async function logout() {
    const { error } = await supabase.auth.signOut();
    console.error('Error logging out: ', error);

    currentOrg.set(defaultCurrentOrgState);
    orgs.set([]);
    user.set(defaultUserState);
    profile.set(defaultProfileState);

    capturePosthogEvent('user_logged_out');
    posthog.reset();
    goto('/login');
  }
</script>

<PrimaryButton variant={VARIANTS.OUTLINED} label={$t('settings.profile.logout')} onClick={logout} />
