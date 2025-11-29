<script lang="ts">
  import { page } from '$app/state';

  import OrgLandingPage from '$lib/components/Org/LandingPage/index.svelte';
  import PlayQuiz from '$lib/components/Org/Quiz/Play/index.svelte';
  import { PageRestricted } from '$lib/components/Page';
  import Snackbar from '$lib/components/Snackbar/index.svelte';
  import { UpgradeModal } from '$lib/features/ui';
  import { user } from '$lib/utils/store/user';
  import { setupAnalytics } from '$lib/utils/functions/appSetup';
  import { setTheme } from '$lib/utils/functions/theme';
  import { initOrgAnalytics } from '$lib/utils/services/posthog';
  import { globalStore } from '$lib/utils/store/app';
  import { currentOrg } from '$lib/utils/store/org';
  import { appInitApi } from '$lib/features/app/init.svelte';
  import merge from 'lodash/merge';
  import { onMount } from 'svelte';
  import { MetaTags } from 'svelte-meta-tags';
  import { authClient } from '$lib/utils/services/auth/client';
  import { PageLoadProgress } from '$lib/features/ui';

  import { ModeWatcher } from '@cio/ui/base/dark-mode';

  import '../app.css';

  let { data, children } = $props();

  let path = $derived(page.url?.pathname?.replace('/', ''));

  function intialAppSetup() {
    console.log(
      'Welcome to ClassroomIO, we are grateful you chose us.',
      page.url.host,
      `\nIs student domain: ${data.isOrgSite}`,
      data
    );

    setupAnalytics();

    if (data.locals.user) {
      user.set({
        ...$user,
        isLoggedIn: true,
        currentSession: data.locals.user
      });
    }

    console.log('user', $user);

    // Authentication Steps
    if (!data.isOrgSite || !data.org) return;

    $globalStore.orgSiteName = data.orgSiteName;
    $globalStore.isOrgSite = data.isOrgSite;

    currentOrg.set(data.org);

    // Setup internal analytics
    initOrgAnalytics(data.orgSiteName);

    setTheme(data.org?.theme);
  }

  onMount(() => {
    intialAppSetup();

    if (data.skipAuth) return;
  });

  const session = authClient.useSession();
  const isSessionReady = $derived(!$session.isPending && !$session.isRefetching && $session.data);

  $effect(() => {
    // this means the session cookie 'classroomio.session_data' expired and we need to trigger a new session
    if (!data.locals.fromSessions && isSessionReady) {
      authClient.getSession().then(() => {
        console.log('triggered new session');
      });
    }
  });

  $effect(() => {
    if (isSessionReady && !appInitApi.isInitializedAndReady && !appInitApi.loading) {
      console.log('setting up account with session data');

      appInitApi.setupApp($session.data as App.Locals, {
        isOrgSite: data.isOrgSite,
        orgSiteName: data.orgSiteName
      });
    }
  });

  const metaTags = $derived(merge(data.baseMetaTags, page.data.pageMetaTags));
</script>

<ModeWatcher />

<MetaTags {...metaTags} />

<UpgradeModal />

<Snackbar />

{#if data.org?.is_restricted || $currentOrg.isRestricted}
  <PageRestricted />
{:else if data.skipAuth}
  <PlayQuiz />
{:else if data.isOrgSite && !path}
  <OrgLandingPage orgSiteName={data.orgSiteName} org={data.org} />
{:else}
  <PageLoadProgress zIndex={10000} />

  {@render children?.()}
{/if}

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

  :global(.plyr__controls) {
    background:
      url(/logo-192.png) 99% 70% no-repeat,
      linear-gradient(rgba(0, 0, 0, 0), rgba(0, 0, 0, 0.5)) !important;
    background-size:
      50px auto,
      auto !important;
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
