<script lang="ts">
  import posthog from 'posthog-js';
  import { goto } from '$app/navigation';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import { VARIANTS } from '$lib/components/PrimaryButton/constants';
  import { supabase } from '$lib/utils/functions/supabase';
  import { capturePosthogEvent } from '$lib/utils/services/posthog';
  import { currentOrg, orgs } from '$lib/utils/store/org';

  async function logout() {
    const { error } = await supabase.auth.signOut();
    console.error('Error logging out: ', error);

    $currentOrg = {
    id: '',
    name: '',
    shortName: '',
    siteName: '',
    avatar_url: '',
    memberId: '',
    role_id: '',
    landingpage: {},
    theme: ''
  }
  $orgs = []
    capturePosthogEvent('user_logged_out');
    posthog.reset();
    goto('/login');
  }
</script>

<PrimaryButton variant={VARIANTS.OUTLINED} label="Log out" onClick={logout} />
