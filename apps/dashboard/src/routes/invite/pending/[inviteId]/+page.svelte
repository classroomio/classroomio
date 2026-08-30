<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { page } from '$app/state';
  import { Button } from '@cio/ui/base/button';
  import { AuthUI } from '$features/ui';
  import { ROLE } from '@cio/utils/constants';
  import { t } from '$lib/utils/functions/translations';
  import { pendingInvitesApi } from '$features/invite/api/pending-invites.svelte';

  const inviteId = $derived(page.params.inviteId as string);
  const invite = $derived(pendingInvitesApi.invites.find((item) => item.id === inviteId));
  const orgName = $derived(invite?.organization.name ?? '');
  const isAccepting = $derived(pendingInvitesApi.acceptingInviteId === inviteId);
  const isLoadingInvite = $derived(!pendingInvitesApi.hasLoaded);

  async function handleSubmit() {
    if (!invite) return;

    const redirectTo = await pendingInvitesApi.acceptInvite(invite.id);

    if (redirectTo) {
      window.location.href = redirectTo;
      return;
    }

    await goto(resolve('/org', {}));
  }

  onMount(() => {
    pendingInvitesApi.fetchPendingInvites();
  });
</script>

<svelte:head>
  <title>{$t('invite.organization.page_title', { orgName })}</title>
</svelte:head>

<AuthUI isLogin={false} {handleSubmit} isLoading={isAccepting} showOnlyContent={true} showLogo={true}>
  <div class="mt-0 w-full">
    {#if isLoadingInvite}
      <p class="text-center text-sm font-light dark:text-white">{$t('invite.organization.loading')}</p>
    {:else if !invite}
      <p class="mt-3 text-center text-sm text-red-500">{$t('invite.organization.not_found')}</p>
    {:else}
      <p class="text-center text-sm font-light dark:text-white">
        {#if invite.roleId === ROLE.STUDENT}
          {$t('invite.organization.invitation_student', { orgName })}
        {:else if invite.roleId === ROLE.TUTOR}
          {$t('invite.organization.invitation_teacher', { orgName })}
        {:else if invite.roleId === ROLE.ADMIN}
          {$t('invite.organization.invitation_admin', { orgName })}
        {:else}
          {$t('invite.organization.invitation_fallback', { orgName, role: invite.roleLabel })}
        {/if}
      </p>
      <p class="mt-3 text-center text-sm font-light dark:text-white">
        {$t('invite.organization.email_line', { email: invite.email })}
      </p>
    {/if}
  </div>

  <div class="my-4 flex w-full flex-col items-center justify-center gap-3">
    {#if invite}
      <Button type="submit" disabled={isAccepting} loading={isAccepting}>
        {$t('invite.organization.accept_button')}
      </Button>
    {:else if !isLoadingInvite}
      <Button type="button" onclick={() => goto(resolve('/org', {}))}>
        {$t('invite.organization.go_to_dashboard')}
      </Button>
    {/if}
  </div>
</AuthUI>
