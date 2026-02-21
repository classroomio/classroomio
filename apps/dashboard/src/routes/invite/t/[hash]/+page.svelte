<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { Button } from '@cio/ui/base/button';
  import { AuthUI } from '$features/ui';
  import { currentOrg } from '$lib/utils/store/org';
  import { setTheme } from '$lib/utils/functions/theme';
  import { classroomio } from '$lib/utils/services/api';
  import { profile } from '$lib/utils/store/user';
  import { snackbar } from '$features/ui/snackbar/store';
  import { page } from '$app/state';

  let { data } = $props();

  let loading = $state(false);

  const inviteStatus = $derived(data.invite?.invite?.status ?? 'INVALID');
  const isInviteEmailMismatch = $derived(
    Boolean(
      $profile.email &&
        data.invite?.invite?.email &&
        $profile.email.toLowerCase() !== data.invite.invite.email.toLowerCase()
    )
  );
  const canJoinOrganization = $derived(inviteStatus === 'ACTIVE' && !isInviteEmailMismatch);

  function getBlockedInviteMessage(): string {
    if (isInviteEmailMismatch) {
      return 'You are logged in with a different email from this invite.';
    }

    if (inviteStatus === 'EXPIRED') {
      return 'This invite link has expired.';
    }

    if (inviteStatus === 'REVOKED') {
      return 'This invite link has been revoked.';
    }

    if (inviteStatus === 'ACCEPTED') {
      return 'This invite has already been used.';
    }

    return 'This invite link is not valid.';
  }

  async function handleSubmit() {
    if (inviteStatus !== 'ACTIVE') {
      snackbar.error(getBlockedInviteMessage());
      return;
    }

    if (!$profile.id || !$profile.email) {
      return goto(`/signup?redirect=${page.url?.pathname || ''}`);
    }

    if (isInviteEmailMismatch) {
      snackbar.error(getBlockedInviteMessage());
      return;
    }

    loading = true;

    try {
      const response = await classroomio.invite.organization[':token'].accept.$post({
        param: { token: data.token }
      });
      const result = await response.json();

      if (!result.success || !result.data) {
        snackbar.error(result.error || 'Failed to join organization');
        return;
      }

      goto(result.data.redirectTo || '/org');
    } catch (error) {
      console.error('Failed to accept organization invite', error);
      snackbar.error('Failed to join organization');
    } finally {
      loading = false;
    }
  }

  onMount(async () => {
    if (!data.currentOrg) return;

    setTheme(data.currentOrg?.theme || '');
    currentOrg.set(data.currentOrg);
  });
</script>

<svelte:head>
  <title>Join {data.invite.organization.name} on ClassroomIO</title>
</svelte:head>

<AuthUI isLogin={false} {handleSubmit} isLoading={loading} showOnlyContent={true} showLogo={true}>
  <div class="mt-0 w-full">
    <h3 class="mt-0 mb-4 text-center text-lg font-medium dark:text-white">{data.invite.organization.name}</h3>
    <p class="text-center text-sm font-light dark:text-white">Role: {data.invite.invite.roleLabel}</p>
    <p class="mt-1 text-center text-sm font-light dark:text-white">Invited email: {data.invite.invite.email}</p>

    {#if !canJoinOrganization}
      <p class="mt-3 text-center text-sm text-red-500">{getBlockedInviteMessage()}</p>
    {/if}
  </div>

  <div class="my-4 flex w-full items-center justify-center">
    <Button type="submit" disabled={!canJoinOrganization || loading} {loading}>Join Organization</Button>
  </div>
</AuthUI>
