<script lang="ts">
  import { browser } from '$app/environment';
  import { page } from '$app/stores';
  import Apps from '$lib/components/Apps/index.svelte';
  import { course } from '$lib/components/Course/store';
  import OrgNavigation from '$lib/components/Navigation/app.svelte';
  import LandingNavigation from '$lib/components/Navigation/index.svelte';
  import LMSNavigation from '$lib/components/Navigation/lms.svelte';
  import OrgLandingPage from '$lib/components/Org/LandingPage/index.svelte';
  import PlayQuiz from '$lib/components/Org/Quiz/Play/index.svelte';
  import Restricted from '$lib/components/Page/Restricted.svelte';
  import PageLoadProgressBar from '$lib/components/Progress/PageLoadProgressBar.svelte';
  import Snackbar from '$lib/components/Snackbar/index.svelte';
  import UpgradeModal from '$lib/components/Upgrade/Modal.svelte';
  import { isCoursesPage, isLMSPage, isOrgPage, toggleBodyByMode } from '$lib/utils/functions/app';
  import { getProfile, setupAnalytics } from '$lib/utils/functions/appSetup';
  import hideNavByRoute from '$lib/utils/functions/routes/hideNavByRoute';
  import showAppsSideBar from '$lib/utils/functions/showAppsSideBar';
  import { getSupabase } from '$lib/utils/functions/supabase';
  import { setTheme } from '$lib/utils/functions/theme';
  import { initOrgAnalytics } from '$lib/utils/services/posthog';
  import { globalStore } from '$lib/utils/store/app';
  import { currentOrg } from '$lib/utils/store/org';
  import { isMobile } from '$lib/utils/store/useMobile';
  import { user } from '$lib/utils/store/user';
  import { Theme } from 'carbon-components-svelte';
  import type { CarbonTheme } from 'carbon-components-svelte/types/Theme/Theme.svelte';
  import merge from 'lodash/merge';
  import { onMount } from 'svelte';
  import { MetaTags } from 'svelte-meta-tags';

  import '../app.postcss';

  export let data;

  let supabase = getSupabase();
  let path = $page.url?.pathname?.replace('/', '');
  let queryParam = $page.url?.search;
  let carbonTheme: CarbonTheme = 'white';

  function handleResize() {
    isMobile.update(() => window.innerWidth <= 760);
  }

  onMount(() => {
    console.log(
      'Welcome to ClassroomIO, we are grateful you chose us.',
      $page.url.host,
      `\nIs student domain: ${data.isOrgSite}`
    );

    if (browser) {
      // Update theme - dark or light mode
      $globalStore.isDark = localStorage.getItem('mode') === 'dark';
      toggleBodyByMode($globalStore.isDark);

      if (data.isOrgSite && data.org?.theme) {
        setTheme(data.org?.theme);
      }
    }
    setupAnalytics();

    handleResize();

    // if (!isSupabaseTokenInLocalStorage() && !isPublicRoute($page.url?.pathname)) {
    //   console.log('No auth token and is not a public route, redirect to login', path);
    //   return goto('/login?redirect=/' + path);
    // }

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      // Log key events
      console.log(`event`, event);

      if (path.includes('reset')) {
        console.log('Dont change auth when on reset page');
        return;
      }

      // Skip Authentication
      if (data.skipAuth || $user.fetchingUser) return;

      // Authentication Steps
      if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
        $user.fetchingUser = true;
        getProfile({
          path,
          queryParam,
          isOrgSite: data.isOrgSite,
          orgSiteName: data.orgSiteName
        }).then(() => {
          $user.fetchingUser = false;
        });
      }
      // else if (!['TOKEN_REFRESHED'].includes(event)) {
      //   console.log('not logged in, go to login');
      //   return goto('/login');
      // }
    });

    if (data.isOrgSite && data.org && !$currentOrg.siteName) {
      $globalStore.orgSiteName = data.orgSiteName;
      $globalStore.isOrgSite = data.isOrgSite;

      currentOrg.set(data.org);

      // Setup internal analytics
      initOrgAnalytics(data.orgSiteName);
    }

    return () => {
      console.log('unsubscribed');
      authListener.subscription.unsubscribe();
    };
  });

  $: path = $page.url?.pathname?.replace('/', '');
  $: carbonTheme = $globalStore.isDark ? 'g100' : 'white';
  $: metaTags = merge(data.baseMetaTags, $page.data.pageMetaTags);
</script>

<svelte:window on:resize={handleResize} />

<MetaTags {...metaTags} />

<Theme bind:theme={carbonTheme} />

<UpgradeModal />
<Snackbar />

{#if data.org?.is_restricted || $currentOrg.is_restricted}
  <Restricted />
{:else if data.skipAuth}
  <PlayQuiz />
{:else if data.isOrgSite && !path}
  <OrgLandingPage orgSiteName={data.orgSiteName} org={data.org} />
{:else}
  <main class="font-roboto dark:bg-black">
    {#if !hideNavByRoute($page.url?.pathname)}
      {#if isOrgPage($page.url?.pathname) || $page.url?.pathname.includes('profile') || isCoursesPage(path)}
        <OrgNavigation bind:title={$course.title} isCoursePage={isCoursesPage(path)} />
      {:else if isLMSPage($page.url?.pathname)}
        <LMSNavigation />
      {:else}
        <LandingNavigation
          isOrgSite={data.isOrgSite}
          logo={data.isOrgSite ? $currentOrg.avatar_url : undefined}
          orgName={data.isOrgSite ? $currentOrg.name : undefined}
          disableSignup={false}
        />
      {/if}

      <PageLoadProgressBar textColorClass="text-neutral-700" />
    {/if}

    <div class={path.includes('home') ? '' : 'flex justify-between'}>
      <slot />

      {#if showAppsSideBar(path)}
        <Apps />
      {/if}
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
    --app-background: radial-gradient(
      circle at 10% 20%,
      rgb(239, 246, 249) 0%,
      rgb(206, 239, 253) 90%
    );
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
