<script lang="ts">
  import Modal from '$lib/components/Modal/index.svelte';
  import { onMount, onDestroy } from 'svelte';
  import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
  import type { OrganizationPlan } from '$lib/utils/types';
  import UpgradePlanCard from './UpgradePlanCard.svelte';
  import { supabase } from '$lib/utils/functions/supabase';
  import { isUpgradeModalOpen } from './store';
  import { currentOrg } from '$lib/utils/store/org';

  let orgPlanChannel: RealtimeChannel;

  async function handleInsert(payload: RealtimePostgresChangesPayload<OrganizationPlan>) {
    const newPlan = payload.new as OrganizationPlan;

    console.log('A new plan was inserted');
    // If plan was successfully generated
    if (newPlan.org_id === $currentOrg.id && newPlan.is_active) {
      window.location.reload();
    }
  }

  onMount(() => {
    orgPlanChannel = supabase
      .channel('any')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'organization_plan' },
        handleInsert
      )
      .subscribe();
  });

  onDestroy(() => {
    if (orgPlanChannel) {
      supabase.removeChannel(orgPlanChannel);
    }
  });
</script>

<Modal
  onClose={() => ($isUpgradeModalOpen = false)}
  bind:open={$isUpgradeModalOpen}
  width="w-4/5"
  containerClass=""
  modalHeading="Upgrade Plan"
>
  <div>
    <UpgradePlanCard />
  </div>
</Modal>
