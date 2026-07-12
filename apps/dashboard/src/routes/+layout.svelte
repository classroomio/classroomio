<script lang="ts">
  import { page } from '$app/state';
  import { onMount } from 'svelte';

  import { Snackbar } from '$features/ui';
  import { appInitApi } from '$features/app/init.svelte';
  import PendingInviteModal from '$features/lms/components/pending-invite-modal.svelte';
  import { resolveAppOrgParams } from '$features/app/resolve-app-org-params';
  import { setupCloudAnalytics } from '$lib/utils/functions/appSetup';
  import { globalStore } from '$lib/utils/store/app';
  import { currentOrg, mergeAccountOrgFromServer } from '$lib/utils/store/org';
  import { get } from 'svelte/store';
  import { user } from '$lib/utils/store/user';
  import { setTheme } from '$lib/utils/functions/theme';
  import { authClient } from '$lib/utils/services/auth/client';
  import merge from 'lodash/merge';
  import { MetaTags } from 'svelte-meta-tags';
  import { ModeWatcher } from '@cio/ui/base/dark-mode';
  import OrgSiteFavicon from '$features/app/org-site-favicon.svelte';
  import { isPublicOrgSitePage } from '$lib/utils/functions/color-scheme';

  import '../app.css';

  import { setUploadLimitsContext } from '$lib/utils/config/upload-limits-context';

  let { data, children } = $props();

  setUploadLimitsContext(data.uploadLimits);

  const metaTags = $derived(merge(data.baseMetaTags, page.data.pageMetaTags));
  const forceLightMode = $derived(isPublicOrgSitePage(data.isOrgSite, page.url.pathname));

  onMount(() => {
    console.log('Layout', data);

    const sessionUser = data?.locals?.user;
    setupCloudAnalytics(
      sessionUser ? { id: sessionUser.id, email: sessionUser.email, name: sessionUser.name } : undefined
    );

    if (data?.locals?.user) {
      user.set({
        ...$user,
        isLoggedIn: true,
        currentSession: data.locals.user
      });
    }
  });

  $effect(() => {
    if (!data.isOrgSite || !data.org) {
      $globalStore.isOrgSite = false;
      $globalStore.orgSiteName = '';
      return;
    }

    $globalStore.orgSiteName = data.orgSiteName || '';
    $globalStore.isOrgSite = true;

    const existingOrg = get(currentOrg);
    const shouldSetPublicOrg =
      !existingOrg.id || existingOrg.siteName !== data.org.siteName || existingOrg.roleId === 0;

    if (shouldSetPublicOrg) {
      currentOrg.set(mergeAccountOrgFromServer(data.org));
    }

    setTheme(data.org.theme || 'blue');
  });

  const session = authClient.useSession();
  const isSessionReady = $derived(!$session.isPending && !$session.isRefetching && $session.data);
  const appOrgParams = $derived(resolveAppOrgParams(data, page.url.pathname, page.params.slug));

  /*
    Auth + org context for the whole dashboard.

    setupApp runs once per session to load /account. After that, org context can
    still change when a logged-in user navigates to a different tenant subdomain
    or opens another /org/[slug] on the app host — without another setupApp run.
    syncOrgContext re-pins currentOrg from the URL + cached account data.
  */
  $effect(() => {
    if (!isSessionReady || appInitApi.loading) {
      return;
    }

    if (!appInitApi.isInitializedAndReady) {
      appInitApi.setupApp($session.data as App.Locals, appOrgParams);
      return;
    }

    void appInitApi.syncOrgContext(appOrgParams);
  });
</script>

{#if data.isOrgSite}
  <OrgSiteFavicon org={data.org} />
{/if}

<svelte:head>
  {#if !data.isOrgSite}
    <link rel="icon" type="image/png" href="/favicon.ico" />
    <link rel="icon" type="image/png" sizes="32x32" href="/logo-32.png" />
  {/if}
</svelte:head>

<div>
  {#key forceLightMode}
    {#if forceLightMode}
      <ModeWatcher defaultMode="light" track={false} />
    {:else}
      <ModeWatcher />
    {/if}
  {/key}

  <MetaTags {...metaTags} />

  <Snackbar />

  {#if appInitApi.pendingOrgInvite}
    <PendingInviteModal
      bind:open={appInitApi.showPendingInviteModal}
      invite={appInitApi.pendingOrgInvite}
      onAccepted={(redirectTo) => appInitApi.handlePendingInviteAccepted(redirectTo)}
    />
  {/if}

  {@render children?.()}
</div>

<style>
  :global(:root) {
    --main-primary-color: rgba(29, 78, 216, 1);
    --border-color: #eaecef;
  }

  :global(.dark svg.dark) {
    fill: #fff;
  }

  :global(.border-c) {
    border: 1px solid var(--border-color);
  }

  :global(.border-bottom-c) {
    border-bottom: 1px solid var(--border-color);
  }

  :global(.cards-container) {
    width: 90%;
    margin: 0 auto;
    padding: 0;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    column-gap: 12px;
    row-gap: 12px;
  }

  @media screen and (max-width: 768px) {
    :global(.cards-container) {
      width: 95%;
      margin: 0 auto;
      padding: 0;
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      column-gap: 12px;
      row-gap: 12px;
    }
  }
</style>
