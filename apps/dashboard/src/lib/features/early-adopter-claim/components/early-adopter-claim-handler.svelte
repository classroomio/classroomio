<script lang="ts">
  import { onMount } from 'svelte';
  import { currentOrg } from '$lib/utils/store/org';
  import { profile } from '$lib/utils/store/user';
  import { earlyAdopterClaimApi } from '../api/early-adopter-claim.svelte';

  onMount(() => {
    earlyAdopterClaimApi.hydrate();
  });

  $effect(() => {
    const organizationId = $currentOrg.id;

    if (!organizationId || !$profile.id) return;

    void earlyAdopterClaimApi.claimStoredToken(organizationId);
  });
</script>
