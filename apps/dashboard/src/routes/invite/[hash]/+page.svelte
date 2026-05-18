<script lang="ts">
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { onMount } from 'svelte';
  import { Button } from '@cio/ui/base/button';
  import { AuthUI } from '$features/ui';
  import { currentOrg, mergeAccountOrgFromServer } from '$lib/utils/store/org';
  import { setTheme } from '$lib/utils/functions/theme';
  import { classroomio } from '$lib/utils/services/api';
  import { profile } from '$lib/utils/store/user';
  import { snackbar } from '$features/ui/snackbar/store';
  import { page } from '$app/state';
  import { t } from '$lib/utils/functions/translations';
  import { ROLE } from '@cio/utils/constants';

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
  const isAlreadyJoined = $derived(inviteStatus === 'ACCEPTED');

  const orgSlug = $derived(data.currentOrg?.siteName ?? data.invite.organization.siteName ?? '');

  function buildInviteAuthParams(pathname: string, email: string): string {
    const parts: string[] = [];
    if (pathname) parts.push(`redirect=${encodeURIComponent(pathname)}`);
    if (email) parts.push(`email=${encodeURIComponent(email)}`);
    return parts.join('&');
  }

  const loginParams = $derived(buildInviteAuthParams(page.url?.pathname || '', data.invite?.invite?.email || ''));

  const orgName = $derived(data.invite?.organization?.name ?? '');
  const inviteRoleId = $derived(data.invite?.invite?.roleId ?? 0);

  function getBlockedInviteMessage(): string {
    if (isInviteEmailMismatch) {
      return t.get('invite.organization.messages.email_mismatch');
    }

    if (inviteStatus === 'EXPIRED') {
      return t.get('invite.organization.messages.expired');
    }

    if (inviteStatus === 'REVOKED') {
      return t.get('invite.organization.messages.revoked');
    }

    if (inviteStatus === 'ACCEPTED') {
      return t.get('invite.organization.messages.accepted');
    }

    return t.get('invite.organization.messages.invalid');
  }

  async function handleSubmit() {
    if (inviteStatus !== 'ACTIVE') {
      snackbar.error(getBlockedInviteMessage());
      return;
    }

    if (!$profile.id || !$profile.email) {
      const qs = buildInviteAuthParams(page.url?.pathname || '', data.invite?.invite?.email || '');
      return goto(resolve(`/signup?${qs}`, {}));
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
        const failed = result as { error?: string; message?: string };
        snackbar.error(failed.error ?? failed.message ?? t.get('invite.organization.messages.join_failed'));
        return;
      }

      snackbar.success('invite.organization.messages.joined');

      window.location.href = result.data.redirectTo || '/org';
    } catch (error) {
      console.error('Failed to accept organization invite', error);
      snackbar.error('invite.organization.messages.join_failed');
    } finally {
      loading = false;
    }
  }

  function handleNavigateAfterJoined() {
    if (inviteRoleId === ROLE.STUDENT) {
      return goto(resolve('/lms', {}));
    }
    return goto(resolve(orgSlug ? `/org/${orgSlug}` : '/org', {}));
  }

  onMount(async () => {
    if (!data.currentOrg) return;

    setTheme(data.currentOrg?.theme || '');
    currentOrg.set(mergeAccountOrgFromServer(data.currentOrg));
  });
</script>

<svelte:head>
  <title>{$t('invite.organization.page_title', { orgName: data.invite.organization.name })}</title>
</svelte:head>

<AuthUI isLogin={false} {handleSubmit} isLoading={loading} showOnlyContent={true} showLogo={true}>
  <div class="mt-0 w-full">
    <p class="text-center text-sm font-light dark:text-white">
      {#if inviteRoleId === ROLE.STUDENT}
        {$t('invite.organization.invitation_student', { orgName })}
      {:else if inviteRoleId === ROLE.TUTOR}
        {$t('invite.organization.invitation_teacher', { orgName })}
      {:else if inviteRoleId === ROLE.ADMIN}
        {$t('invite.organization.invitation_admin', { orgName })}
      {:else}
        {$t('invite.organization.invitation_fallback', {
          orgName,
          role: data.invite.invite.roleLabel
        })}
      {/if}
    </p>
    <p class="mt-3 text-center text-sm font-light dark:text-white">
      {$t('invite.organization.email_line', { email: data.invite.invite.email })}
    </p>

    {#if !canJoinOrganization && !isAlreadyJoined}
      <p class="mt-3 text-center text-sm text-red-500">{getBlockedInviteMessage()}</p>
    {/if}
  </div>

  <div class="my-4 flex w-full flex-col items-center justify-center gap-3">
    {#if isAlreadyJoined}
      <Button type="button" onclick={handleNavigateAfterJoined}>
        {#if inviteRoleId === ROLE.STUDENT}
          {$t('navigation.goto_lms')}
        {:else}
          {$t('invite.organization.go_to_dashboard')}
        {/if}
      </Button>
    {:else}
      <Button type="submit" disabled={!canJoinOrganization || loading} {loading}>
        {$t('invite.organization.accept_button')}
      </Button>
    {/if}
    <p class="ui:text-muted-foreground text-center text-sm">
      {$t('login.already_have_account')}
      <a class="ui:text-primary hover:underline" href={resolve(`/login?${loginParams}`, {})}> {$t('login.login')}</a>
    </p>
  </div>
</AuthUI>
