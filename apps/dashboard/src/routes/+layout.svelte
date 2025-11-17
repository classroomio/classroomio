<script lang="ts">
  import { page } from '$app/state';

  import { course } from '$lib/components/Course/store';
  import OrgNavigation from '$lib/components/Navigation/app.svelte';
  import LandingNavigation from '$lib/components/Navigation/index.svelte';
  import LMSNavigation from '$lib/components/Navigation/lms.svelte';
  import OrgLandingPage from '$lib/components/Org/LandingPage/index.svelte';
  import PlayQuiz from '$lib/components/Org/Quiz/Play/index.svelte';
  import { PageRestricted } from '$lib/components/Page';
  import Snackbar from '$lib/components/Snackbar/index.svelte';
  import UpgradeModal from '$lib/components/Upgrade/Modal.svelte';
  import { user } from '$lib/utils/store/user';
  import { isCoursesPage, isLMSPage, isOrgPage } from '$lib/utils/functions/app';
  import { setupAnalytics } from '$lib/utils/functions/appSetup';
  import hideNavByRoute from '$lib/utils/functions/routes/hideNavByRoute';
  import { setTheme } from '$lib/utils/functions/theme';
  import { initOrgAnalytics } from '$lib/utils/services/posthog';
  import { globalStore } from '$lib/utils/store/app';
  import { currentOrg } from '$lib/utils/store/org';
  import { appInitApi } from '$lib/features/app/init.svelte';
  import merge from 'lodash/merge';
  import { onMount } from 'svelte';
  import { MetaTags } from 'svelte-meta-tags';
  import { authClient } from '$lib/utils/services/auth/client';

  import { ModeWatcher } from '@cio/ui/base/dark-mode';

  import '../app.css';

  let { data, children } = $props();

  let path = $derived(page.url?.pathname?.replace('/', ''));

  $effect(() => {
    console.log('account status, loading,error,data:', appInitApi.loading, appInitApi.error, appInitApi.data);
  });

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
  $effect(() => {
    const isSessionReady = !$session.isPending && !$session.isRefetching && $session.data;
    if (isSessionReady && !appInitApi.isInitializedAndReady) {
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

<!-- <Theme bind:theme={carbonTheme} /> -->

<UpgradeModal />

<Snackbar />

{#if data.org?.is_restricted || $currentOrg.isRestricted}
  <PageRestricted />
{:else if data.skipAuth}
  <PlayQuiz />
{:else if data.isOrgSite && !path}
  <OrgLandingPage orgSiteName={data.orgSiteName} org={data.org} />
{:else}
  <main class="font-roboto dark:bg-black">
    {#if !hideNavByRoute(page.url?.pathname)}
      {#if isOrgPage(page.url?.pathname) || page.url?.pathname.includes('profile') || isCoursesPage(path)}
        <OrgNavigation bind:title={$course.title} isCoursePage={isCoursesPage(path)} />
      {:else if isLMSPage(page.url?.pathname)}
        <LMSNavigation />
      {:else}
        <LandingNavigation
          isOrgSite={data.isOrgSite}
          logo={data.isOrgSite ? $currentOrg.avatarUrl : undefined}
          orgName={data.isOrgSite ? $currentOrg.name : undefined}
          disableSignup={false}
        />
      {/if}

      <!-- <PageLoadProgressBar textColorClass="text-neutral-700" /> -->
    {/if}

    <div class={path.includes('home') ? '' : 'flex justify-between'}>
      {@render children?.()}
    </div>
  </main>
{/if}

<style>
  main {
    background-color: white;
    box-sizing: border-box;
  }

  :global(a:hover) {
    text-decoration: underline;
  }
  :global(:root) {
    --main-primary-color: rgba(29, 78, 216, 1);
    --border-color: #eaecef;
    --app-background-color: #fafbfc;
    --app-background: radial-gradient(circle at 10% 20%, rgb(239, 246, 249) 0%, rgb(206, 239, 253) 90%);
    --dark-app-background: radial-gradient(circle at 10% 20%, rgb(0 0 0) 0%, rgb(27 60 74) 90%);
  }

  :global(.app-background) {
    background: var(--app-background);
  }
  :global(.dark .app-background) {
    background: var(--dark-app-background);
  }

  :global(.bx--data-table-container) {
    width: 100%;
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

  :global(.bx--search-close > svg) {
    fill: black;
  }

  :global(.dark .bx--search-close:hover > svg) {
    fill: #fff;
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
