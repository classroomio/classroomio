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

  let { data } = $props();

  let loading = $state(false);

  const isDisabled = $derived(data.invite?.invite?.isRevoked === true);
  const isCohortInactive = $derived(data.invite?.cohort?.isActive === false);
  const canJoin = $derived(!isDisabled && !isCohortInactive);

  const orgName = $derived(data.invite?.organization?.name ?? '');
  const cohortName = $derived(data.invite?.cohort?.name ?? '');

  function buildAuthParams(pathname: string): string {
    const parts: string[] = [];
    if (pathname) parts.push(`redirect=${encodeURIComponent(pathname)}`);
    return parts.join('&');
  }

  const loginParams = $derived(buildAuthParams(page.url?.pathname || ''));

  function getBlockedMessageKey(): string {
    if (isDisabled) return 'invite.cohort.disabled';

    return 'invite.cohort.inactive';
  }

  async function handleSubmit() {
    if (!canJoin) {
      snackbar.error(t.get(getBlockedMessageKey()));
      return;
    }

    if (!$profile.id || !$profile.email) {
      const qs = buildAuthParams(page.url?.pathname || '');
      return goto(resolve(`/signup?${qs}`, {}));
    }

    loading = true;

    try {
      const response = await classroomio.invite.cohort[':token'].accept.$post({
        param: { token: data.token }
      });
      const result = await response.json();

      if (!result.success || !result.data) {
        const failed = result as { error?: string; message?: string };
        snackbar.error(failed.error ?? failed.message ?? t.get('invite.cohort.join_failed'));
        return;
      }

      snackbar.success('invite.cohort.joined');

      window.location.href = result.data.redirectTo || '/lms';
    } catch (error) {
      console.error('Failed to accept cohort invite', error);
      snackbar.error('invite.cohort.join_failed');
    } finally {
      loading = false;
    }
  }

  onMount(async () => {
    if (!data.currentOrg) return;

    setTheme(data.currentOrg?.theme || '');
    currentOrg.set(mergeAccountOrgFromServer(data.currentOrg));
  });
</script>

<svelte:head>
  <title>{$t('invite.cohort.page_title', { cohortName })}</title>
</svelte:head>

<AuthUI isLogin={false} {handleSubmit} isLoading={loading} showOnlyContent={true} showLogo={true}>
  <div class="mt-0 w-full">
    <p class="text-center text-sm font-light dark:text-white">
      {$t('invite.cohort.invitation', { cohortName, orgName })}
    </p>

    {#if !canJoin}
      <p class="mt-3 text-center text-sm text-red-500">{$t(getBlockedMessageKey())}</p>
    {/if}
  </div>

  <div class="my-4 flex w-full flex-col items-center justify-center gap-3">
    <Button type="submit" disabled={!canJoin || loading} {loading}>
      {$t('invite.cohort.accept_button')}
    </Button>
    <p class="ui:text-muted-foreground text-center text-sm">
      {$t('login.already_have_account')}
      <a class="ui:text-primary hover:underline" href={resolve(`/login?${loginParams}`, {})}> {$t('login.login')}</a>
    </p>
  </div>
</AuthUI>
