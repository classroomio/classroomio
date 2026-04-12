<script lang="ts">
  import { onMount } from 'svelte';
  import { DashboardPage } from '$features/lms/pages';
  import PendingInviteModal from '$features/lms/components/pending-invite-modal.svelte';
  import { getGreeting } from '$lib/utils/functions/date';
  import { t } from '$lib/utils/functions/translations';
  import { profile } from '$lib/utils/store/user';
  import { currentOrg } from '$lib/utils/store/org';
  import { classroomio } from '$lib/utils/services/api';
  import * as Page from '@cio/ui/base/page';
  import type { PendingOrgInvite } from '$features/lms/utils/types';

  let pendingInvite = $state<PendingOrgInvite | null>(null);
  let showInviteModal = $state(false);

  onMount(async () => {
    if (!$profile.id || !$currentOrg.id) return;

    try {
      const response = await classroomio.invite.organization.pending.$get();
      const result = await response.json();

      if (result.success && result.data) {
        pendingInvite = result.data;
        showInviteModal = true;
      }
    } catch (error) {
      console.error('Failed to check pending org invite', error);
    }
  });

  function handleInviteAccepted() {
    window.location.href = '/lms';
  }
</script>

<svelte:head>
  <title>Student Dashboard - ClassroomIO</title>
</svelte:head>

<Page.Root class="w-full">
  <Page.Header>
    <Page.HeaderContent>
      <Page.Title>
        {$t(getGreeting())}
        {$profile.fullname}!
      </Page.Title>
    </Page.HeaderContent>
  </Page.Header>
  <Page.Body>
    {#snippet child()}
      <DashboardPage />
    {/snippet}
  </Page.Body>
</Page.Root>

{#if pendingInvite}
  <PendingInviteModal bind:open={showInviteModal} invite={pendingInvite} onAccepted={handleInviteAccepted} />
{/if}
