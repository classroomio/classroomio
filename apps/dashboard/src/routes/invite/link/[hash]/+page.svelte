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

  const isDisabled = $derived(data.invite?.invite?.isRevoked === true);
  const canJoin = $derived(!isDisabled);

  const orgSlug = $derived(data.currentOrg?.siteName ?? data.invite.organization.siteName ?? '');
  const orgName = $derived(data.invite?.organization?.name ?? '');
  const inviteRoleId = $derived(data.invite?.invite?.roleId ?? 0);

  function buildAuthParams(pathname: string): string {
    const parts: string[] = [];
    if (pathname) parts.push(`redirect=${encodeURIComponent(pathname)}`);
    return parts.join('&');
  }

  const loginParams = $derived(buildAuthParams(page.url?.pathname || ''));

  async function handleSubmit() {
    if (isDisabled) {
      snackbar.error(t.get('invite.link.disabled'));
      return;
    }

    if (!$profile.id || !$profile.email) {
      const qs = buildAuthParams(page.url?.pathname || '');
      return goto(resolve(`/signup?${qs}`, {}));
    }

    loading = true;

    try {
      const response = await classroomio.invite.link[':token'].accept.$post({
        param: { token: data.token }
      });
      const result = await response.json();

      if (!result.success || !result.data) {
        const failed = result as { error?: string; message?: string };
        snackbar.error(failed.error ?? failed.message ?? t.get('invite.link.join_failed'));
        return;
      }

      snackbar.success('invite.link.joined');

      window.location.href = result.data.redirectTo || '/org';
    } catch (error) {
      console.error('Failed to accept link invite', error);
      snackbar.error('invite.link.join_failed');
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
  <title>{$t('invite.link.page_title', { orgName: data.invite.organization.name })}</title>
</svelte:head>

<AuthUI isLogin={false} {handleSubmit} isLoading={loading} showOnlyContent={true} showLogo={true}>
  <div class="mt-0 w-full">
    <p class="text-center text-sm font-light dark:text-white">
      {#if inviteRoleId === ROLE.STUDENT}
        {$t('invite.link.invitation_student', { orgName })}
      {:else if inviteRoleId === ROLE.TUTOR}
        {$t('invite.link.invitation_teacher', { orgName })}
      {:else if inviteRoleId === ROLE.ADMIN}
        {$t('invite.link.invitation_admin', { orgName })}
      {:else}
        {$t('invite.link.invitation_fallback', { orgName, role: data.invite.invite.roleLabel })}
      {/if}
    </p>

    {#if isDisabled}
      <p class="mt-3 text-center text-sm text-red-500">{$t('invite.link.disabled')}</p>
    {/if}
  </div>

  <div class="my-4 flex w-full flex-col items-center justify-center gap-3">
    <Button type="submit" disabled={!canJoin || loading} {loading}>
      {$t('invite.link.accept_button')}
    </Button>
    <p class="ui:text-muted-foreground text-center text-sm">
      {$t('login.already_have_account')}
      <a class="ui:text-primary hover:underline" href={resolve(`/login?${loginParams}`, {})}> {$t('login.login')}</a>
    </p>
  </div>
</AuthUI>
