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
  const isResourceClosed = $derived(data.invite?.resource?.isResourceOpen === false);
  const canJoin = $derived(!isDisabled && !isResourceClosed);

  const orgName = $derived(data.invite?.organization?.name ?? '');
  const resourceName = $derived(data.invite?.resource?.resourceName ?? '');
  const resourceType = $derived(data.invite?.resource?.resourceType);

  // One page for every resource type — only the noun changes.
  const joinLabel = $derived(
    resourceType === 'COHORT' ? $t('invite_link.join.cohort_button') : $t('invite_link.join.course_button')
  );

  function buildAuthParams(pathname: string): string {
    const parts: string[] = [];
    if (pathname) parts.push(`redirect=${encodeURIComponent(pathname)}`);
    return parts.join('&');
  }

  const loginParams = $derived(buildAuthParams(page.url?.pathname || ''));

  function getBlockedMessageKey(): string {
    if (isDisabled) return 'invite_link.join.disabled';

    return 'invite_link.join.closed';
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
      const response = await classroomio.invite.r[':token'].accept.$post({
        param: { token: data.token }
      });
      const result = await response.json();

      if (!result.success || !result.data) {
        const failed = result as { error?: string; message?: string };
        snackbar.error(failed.error ?? failed.message ?? t.get('invite_link.join.failed'));
        return;
      }

      snackbar.success('invite_link.join.succeeded');

      window.location.href = result.data.redirectTo || '/lms';
    } catch (error) {
      console.error('Failed to accept invite link', error);
      snackbar.error('invite_link.join.failed');
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
  <title>{$t('invite_link.join.page_title', { resourceName })}</title>
</svelte:head>

<AuthUI isLogin={false} {handleSubmit} isLoading={loading} showOnlyContent={true} showLogo={true}>
  <div class="mt-0 w-full">
    <p class="text-center text-sm font-light dark:text-white">
      {$t('invite_link.join.invitation', { resourceName, orgName })}
    </p>

    {#if data.invite?.resource?.description}
      <p class="ui:text-muted-foreground mt-2 text-center text-sm">{data.invite.resource.description}</p>
    {/if}

    {#if !canJoin}
      <p class="mt-3 text-center text-sm text-red-500">{$t(getBlockedMessageKey())}</p>
    {/if}
  </div>

  <div class="my-4 flex w-full flex-col items-center justify-center gap-3">
    <Button type="submit" disabled={!canJoin || loading} {loading}>
      {joinLabel}
    </Button>
    <p class="ui:text-muted-foreground text-center text-sm">
      {$t('login.already_have_account')}
      <a class="ui:text-primary hover:underline" href={resolve(`/login?${loginParams}`, {})}> {$t('login.login')}</a>
    </p>
  </div>
</AuthUI>
