<script lang="ts">
  import { page } from '$app/state';
  import { onMount } from 'svelte';

  import { Snackbar } from '$features/ui';
  import { appInitApi } from '$features/app/init.svelte';
  import { setupCloudAnalytics } from '$lib/utils/functions/appSetup';
  import { globalStore } from '$lib/utils/store/app';
  import { currentOrg, mergeAccountOrgFromServer } from '$lib/utils/store/org';
  import { user } from '$lib/utils/store/user';
  import { setTheme } from '$lib/utils/functions/theme';
  import { authClient } from '$lib/utils/services/auth/client';
  import merge from 'lodash/merge';
  import { MetaTags } from 'svelte-meta-tags';
  import { ModeWatcher } from '@cio/ui/base/dark-mode';
  import OrgSiteFavicon from '$features/app/org-site-favicon.svelte';

  import '../app.css';

  import { setUploadLimitsContext } from '$lib/utils/config/upload-limits-context';

  let { data, children } = $props();

  setUploadLimitsContext(data.uploadLimits);

  const metaTags = $derived(merge(data.baseMetaTags, page.data.pageMetaTags));

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

    if (data.isOrgSite && data.org) {
      $globalStore.orgSiteName = data.orgSiteName || '';
      $globalStore.isOrgSite = true;
      currentOrg.set(mergeAccountOrgFromServer(data.org));
      setTheme(data.org.theme || 'blue');
    }
  });

  const session = authClient.useSession();
  const isSessionReady = $derived(!$session.isPending && !$session.isRefetching && $session.data);

  $effect(() => {
    if (isSessionReady && !appInitApi.isInitializedAndReady && !appInitApi.loading) {
      appInitApi.setupApp($session.data as App.Locals, {
        isOrgSite: data.isOrgSite,
        orgSiteName: data.orgSiteName,
        orgId: data.org?.id ?? null
      });
    }
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
  <ModeWatcher />

  <MetaTags {...metaTags} />

  <Snackbar />

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
