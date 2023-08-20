<script>
  import { onMount } from 'svelte';
  import { derived } from 'svelte/store';
  import { goto } from '$app/navigation';
  import { dev, browser } from '$app/environment';
  import { page, navigating } from '$app/stores';
  import isEmpty from 'lodash/isEmpty';
  import * as Sentry from '@sentry/browser';
  import { Integrations } from '@sentry/tracing';
  import { CaptureConsole } from '@sentry/integrations';
  import { Theme } from 'carbon-components-svelte';
  import { Moon } from 'svelte-loading-spinners';
  import LandingNavigation from '$lib/components/Navigation/index.svelte';
  import OrgNavigation from '$lib/components/Navigation/app.svelte';
  import LMSNavigation from '$lib/components/Navigation/lms.svelte';
  import OrgLandingPage from '$lib/components/Org/LandingPage/index.svelte';
  import Snackbar from '$lib/components/Snackbar/index.svelte';
  import Backdrop from '$lib/components/Backdrop/index.svelte';
  import OrgSideBar from '$lib/components/Org/SideBar.svelte';
  import LMSSideBar from '$lib/components/LMS/SideBar.svelte';
  // import SideBar from "../components/SideBar/index.svelte";
  // import Footer from '$lib/components/Footer/index.svelte';
  import Apps from '$lib/components/Apps/index.svelte';
  import PlayQuiz from '$lib/components/Org/Quiz/Play/index.svelte';
  import { course } from '$lib/components/Course/store';
  import { isCoursesPage, isOrgPage, isLMSPage, isQuizPage } from '$lib/utils/functions/app';
  import showAppsSideBar from '$lib/utils/functions/showAppsSideBar';
  import isPublicRoute from '$lib/utils/functions/routes/isPublicRoute';
  import { user, profile } from '$lib/utils/store/user';
  import { getSupabase } from '$lib/utils/functions/supabase';
  import { isMobile } from '$lib/utils/store/useMobile';
  import { ROUTES_TO_HIDE_NAV, ROUTE } from '$lib/utils/constants/routes';
  import { getOrganizations, getCurrentOrg } from '$lib/utils/services/org';
  import { toggleBodyByTheme } from '$lib/utils/functions/app';
  import { appStore } from '$lib/utils/store/app';
  import { currentOrg } from '$lib/utils/store/org';

  import '../app.postcss';

  export let data;

  let supabase = getSupabase();
  let path = $page.url?.pathname?.replace('/', '');
  let theme = 'white';

  const delayedPreloading = derived(navigating, (currentPreloading, set) => {
    setTimeout(() => set(currentPreloading), 250);
  });

  function setTheme(theme) {
    document.body.className = document.body.className.concat(' ', theme);
  }

  function setupSentry() {
    if (!dev) {
      Sentry.init({
        dsn: 'https://c966f7e8cb1d4306be20b26bb4f0cc96@o476906.ingest.sentry.io/5999999',
        integrations: [
          new Integrations.BrowserTracing(),
          new CaptureConsole({
            levels: ['error']
          }),
          new Sentry.Replay()
        ],
        environment: !dev ? 'production' : 'development',
        // Set tracesSampleRate to 1.0 to capture 100%
        // of transactions for performance monitoring.
        // We recommend adjusting this value in production
        tracesSampleRate: 0.5
      });
    }
  }

  async function getProfile() {
    const params = new URLSearchParams(window.location.search);
    // Get user profile
    const {
      data: { session }
    } = await supabase.auth.getSession();
    const { user: authUser } = session || {};
    console.log('Get user profile', authUser);

    if (!authUser) {
      goto('/login');
    }

    // Check if user has profile
    let {
      data: profileData,
      error,
      status
    } = await supabase.from('profile').select(`*`).eq('id', authUser?.id).single();

    if (error && !profileData && status === 406 && authUser) {
      // User wasn't found, create profile
      console.log(`User wasn't found, create profile`);

      const [regexUsernameMatch] = [...(authUser.email?.matchAll(/(.*)@/g) || [])];

      const { data, error } = await supabase
        .from('profile')
        .insert({
          id: authUser.id,
          username: regexUsernameMatch[1] + '1669991321770',
          fullname: regexUsernameMatch[1],
          email: authUser.email
        })
        .select();

      // Profile created, go to profile page
      if (!error && data) {
        $user.fetchingUser = false;
        $user.isLoggedIn = true;
        $user.currentSession = authUser;

        profile.set(data[0]);

        // Set user in sentry
        Sentry.setUser($profile);

        if (data.isOrgSite) {
          const { data, error } = await supabase
            .from('organizationmember')
            .insert({
              organization_id: $currentOrg.id,
              profile_id: $profile.id,
              role_id: 3
            })
            .select();
          if (error) {
            console.error('Error adding user to organisation', error);
          } else {
            console.log('Success adding user to organisation', data);
            const memberId = data?.[0]?.id || '';

            $currentOrg.memberId = memberId;
          }

          if (params.get('redirect')) {
            goto(params.get('redirect') || '');
          } else {
            goto('/lms');
          }
          return;
        }

        goto(ROUTE.ONBOARDING);
      }
      $user.fetchingUser = false;
    } else if (profileData) {
      // Profile exists, go to profile page
      $user.fetchingUser = false;
      $user.isLoggedIn = true;
      $user.currentSession = authUser;
      profile.set(profileData);

      // Set user in sentry
      Sentry.setUser($profile);

      const orgRes = await getOrganizations($profile.id);

      // student redirect
      if (data.isOrgSite) {
        if (params.has('redirect')) {
          goto(params.get('redirect') || '');
        } else {
          goto('/lms');
        }
      } else {
        if (isEmpty(orgRes.orgs)) {
          goto(ROUTE.ONBOARDING);
        } else if (
          ['login', 'signup', 'onboarding'].some((r) => path.includes(r)) ||
          path === '' // for home page
        ) {
          // By default redirect to first organization
          goto(`/org/${orgRes.currentOrg.siteName}`);
        }

        setTheme(orgRes.currentOrg.theme);
      }
    }
  }

  function handleResize() {
    isMobile.update(() => window.innerWidth <= 760);
  }

  onMount(() => {
    console.log(
      'Welcome to ClassroomIO, we are grateful you chose us.',
      $page.url.host,
      `\nIs student domain: ${data.isOrgSite}`
    );
    // Disable GA on localhost
    if (dev) {
      console.log('disable GA');
      window['ga-disable-G-C7WBN0S06R'] = true;
    }

    setupSentry();

    handleResize();

    if (
      !localStorage.getItem('sb-koxqonvbkeakwvmdegcf-auth-token') &&
      !isPublicRoute($page.url.pathname)
    ) {
      console.log('No auth token and is not a public route, redirect to login', path);
      return goto('/login');
    }

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      // Log key events
      console.log(`event`, event);
      if (event == 'PASSWORD_RECOVERY') {
        console.log('PASSWORD RESET');
      }

      if (path.includes('reset')) {
        console.log('Dont change auth when on reset page');
        return;
      }

      // Skip Authentication
      if (data.skipAuth) return;

      // Authentication Steps
      if (event === 'SIGNED_IN') {
        $user.fetchingUser = true;
        getProfile();
      } else if (!['INITIAL_SESSION', 'TOKEN_REFRESHED'].includes(event)) {
        console.log('not logged in, go to login');
        return goto('/login');
      }
    });

    if (browser) {
      // Update theme - dark or light mode
      $appStore.isDark = localStorage.getItem('theme') === 'dark';
      toggleBodyByTheme($appStore.isDark);
    }

    if (data.isOrgSite) {
      console.log('data', data);
      $appStore.orgSiteName = data.orgSiteName;
      $appStore.isOrgSite = data.isOrgSite;

      currentOrg.set(data.org);
      setTheme(data.org.theme);
    }

    return () => {
      console.log('unsubscribed');
      authListener?.unsubscribe();
    };
  });

  $: path = $page.url?.pathname?.replace('/', '');
  $: theme = $appStore.isDark ? 'g100' : 'white';
</script>

<svelte:window on:resize={handleResize} />

<svelte:head>
  <link href="/css/carbon.css" rel="stylesheet" />
</svelte:head>

<Theme bind:theme />

<Snackbar />

{#if data.skipAuth}
  <PlayQuiz />
{:else if data.isOrgSite && !path}
  <OrgLandingPage orgSiteName={data.orgSiteName} />
{:else}
  <main class="dark:bg-gray-800">
    {#if $navigating && $delayedPreloading}
      <Backdrop>
        <Moon size="60" color="#1d4ed8" unit="px" duration="1s" />
      </Backdrop>
    {/if}
    {#if !ROUTES_TO_HIDE_NAV.includes($page.url.pathname)}
      {#if isOrgPage($page.url.pathname) || $page.url.pathname.includes('profile') || isCoursesPage(path)}
        <OrgNavigation bind:title={$course.title} isCoursePage={isCoursesPage(path)} />
      {:else if isLMSPage($page.url.pathname)}
        <LMSNavigation />
      {:else}
        <LandingNavigation
          isOrgSite={data.isOrgSite}
          logo={data.isOrgSite ? $currentOrg.avatar_url : undefined}
          orgName={data.isOrgSite ? $currentOrg.name : undefined}
          disableSignup={false}
        />
      {/if}
    {/if}

    <div class="flex justify-between">
      {#if isOrgPage($page.url.pathname)}
        <div class="org-root w-full flex items-center justify-between">
          {#if !isQuizPage($page.url.pathname)}
            <OrgSideBar />
          {/if}
          <div class="org-slot bg-white dark:bg-gray-800">
            <slot />
          </div>
        </div>
      {:else if isLMSPage($page.url.pathname)}
        <div class="org-root w-full flex items-center justify-between">
          <LMSSideBar />
          <div class="org-slot bg-white dark:bg-gray-800">
            <slot />
          </div>
        </div>
      {:else}
        <slot />
      {/if}

      {#if showAppsSideBar(path)}
        <Apps />
      {/if}
    </div>
  </main>

  {#if !['about', ''].includes(path)}
    <!-- <Footer /> -->
  {/if}
{/if}

<style>
  main {
    background-color: white;
    box-sizing: border-box;
  }

  .org-root {
    height: calc(100vh - 44px);
  }
  .org-slot {
    min-width: calc(100vw - 250px);
    height: calc(100vh - 44px);
    overflow-y: auto;
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
  }

  :global(.app-background) {
    background: var(--app-background);
  }

  :global(.bx--data-table-container) {
    width: 100%;
  }

  :global(.dark svg.dark path),
  :global(.active-sidenav svg.dark path),
  :global(.active-sidenav svg.carbon-icon path) {
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
    background: url(/logo-192.png) 99% 70% no-repeat,
      linear-gradient(rgba(0, 0, 0, 0), rgba(0, 0, 0, 0.5)) !important;
    background-size: 50px auto, auto !important;
  }
</style>
