<script context="module">
  export function preload(page, { config, host }) {
    return { config, host };
  }
</script>

<script>
  import { onMount } from 'svelte';
  import { derived } from 'svelte/store';
  import { stores, goto } from '@sapper/app';
  import isEmpty from 'lodash/isEmpty';
  import * as Sentry from '@sentry/browser';
  import { Theme } from 'carbon-components-svelte';
  import { Moon } from 'svelte-loading-spinners';
  import Tailwindcss from '../components/Tailwindcss.svelte';
  import LandingNavigation from '../components/Navigation/index.svelte';
  import OrgNavigation from '../components/Navigation/app.svelte';
  import Snackbar from '../components/Snackbar/index.svelte';
  import Backdrop from '../components/Backdrop/index.svelte';
  import OrgSideBar from '../components/Org/SideBar.svelte';
  // import SideBar from "../components/SideBar/index.svelte";
  // import Footer from '../components/Footer/index.svelte';
  import Apps from '../components/Apps/index.svelte';
  import { handleAuthChange } from '../utils/functions/api';
  import showAppsSideBar from '../utils/functions/showAppsSideBar';
  import { user, profile } from '../utils/store/user';
  import { getSupabase } from '../utils/functions/supabase';
  import { isMobile } from '../utils/store/useMobile';
  import { ROUTES_TO_HIDE_NAV, ROUTE } from '../utils/constants/routes';
  import { getOrganizations } from '../utils/services/org';
  import { toggleBodyByTheme } from '../utils/functions/app';
  import { appStore } from '../utils/store/app';

  export let segment;
  export let config;
  export let host;

  let { page, preloading } = stores();

  let supabase = getSupabase(config);
  let path = $page.path.replace('/', '');
  let theme = 'white';

  const delayedPreloading = derived(preloading, (currentPreloading, set) => {
    setTimeout(() => set(currentPreloading), 250);
  });

  async function getProfile() {
    // Get user profile
    const authUser = supabase.auth.user();
    console.log('Get user profile', authUser);

    // Check if user has profile
    let {
      data: profileData,
      error,
      status,
    } = await supabase
      .from('profile')
      .select(`*`)
      .eq('id', authUser.id)
      .single();

    if (error && !profileData && status === 406) {
      // User wasn't found, create profile
      console.log(`User wasn't found, create profile`);

      const [regexUsernameMatch] = [...authUser.email.matchAll(/(.*)@/g)];

      const { data, error } = await supabase.from('profile').insert({
        id: authUser.id,
        username: regexUsernameMatch[1] + '1669991321770',
        fullname: regexUsernameMatch[1],
        email: authUser.email,
      });

      // Profile created, go to profile page
      if (!error && data) {
        $user.fetchingUser = false;
        $user.isLoggedIn = true;
        $user.currentSession = authUser;

        profile.set(data[0]);

        // Set user in sentry
        Sentry.setUser($profile);

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

      // If user coming to login page, then
      if (isEmpty(orgRes.orgs)) {
        goto(ROUTE.ONBOARDING);
      } else if (
        ['login', 'signup', 'onboarding'].includes(path) ||
        path === '' // for home page
      ) {
        // By default redirect to first organization
        goto(`/org/${orgRes.currentOrg.siteName}`);
      }
    }
  }

  function isCoursePage(path) {
    return /course[s]*\/[a-z 0-9 -]/.test(path);
  }

  function isOrgPage(path) {
    return /org\/[a-z 0-9 -]/.test(path);
  }

  function handleResize() {
    isMobile.update(() => window.innerWidth <= 760);
  }

  onMount(() => {
    console.log('Welcome to ClassroomIO, we are grateful you chose us.', host);
    // Disable GA on localhost
    if (config && !config.isProd) {
      console.log('disable GA');
      window['ga-disable-G-C7WBN0S06R'] = true;
    }

    handleResize();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (config.isProd) {
          handleAuthChange(event, session);
        }
        console.log(`event`, event);
        if (event == 'PASSWORD_RECOVERY') {
          console.log('PASSWORD RESET');
        }

        if (path.includes('reset')) {
          console.log('Dont change auth when on reset page');
          return;
        }

        if (event === 'SIGNED_IN') {
          $user.fetchingUser = true;
          getProfile();
        } else {
          console.log('not logged in, go to login');
          return goto('/login');
        }
      }
    );

    // Update theme - dark or light mode
    $appStore.isDark = localStorage.getItem('theme') === 'dark';
    toggleBodyByTheme($appStore.isDark);

    return () => {
      authListener.unsubscribe();
    };
  });

  // if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  //   page.subscribe(() => {
  //     const from = window.location.pathname;
  //     const redirect = (href) => {
  //       goto(href);
  //     };
  //     if (!$user.isLoggedIn && !PUBLIC_ROUTES.includes(from)) {
  //       redirect('/login');
  //     }
  //   });
  // }

  $: path = $page.path.replace('/', '');
  $: theme = $appStore.isDark ? 'g100' : 'white';
</script>

<svelte:window on:resize={handleResize} />

<svelte:head>
  <link href="/css/carbon.css" rel="stylesheet" />
</svelte:head>

<Theme bind:theme />
<Tailwindcss />

<!-- <Nav {segment} /> -->
<Snackbar />

<main class="dark:bg-gray-800">
  {#if $preloading && $delayedPreloading}
    <Backdrop>
      <Moon size="60" color="#1d4ed8" unit="px" duration="1s" />
    </Backdrop>
  {/if}
  {#if !ROUTES_TO_HIDE_NAV.includes($page.path) && !isCoursePage(path)}
    {#if $page.path.includes('org') || $page.path.includes('profile')}
      <OrgNavigation />
    {:else}
      <LandingNavigation {segment} />
    {/if}
  {/if}

  <div class="flex justify-between">
    {#if isOrgPage($page.path)}
      <div class="org-root w-full flex items-center justify-between">
        <OrgSideBar />
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
  <!-- <Footer {segment} /> -->
{/if}

<style>
  main {
    background-color: #fafbfc;
    box-sizing: border-box;
  }

  .org-root {
    height: calc(100vh - 44px);
  }
  .org-slot {
    width: calc(100vw - 250px);
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
  }

  :global(.app-background-color) {
    background-color: var(--app-background-color);
  }

  :global(.bx--data-table-container) {
    width: 100%;
  }

  :global(.dark svg.dark path) {
    fill: #fff;
  }

  :global(.border-c) {
    border: 1px solid var(--border-color);
  }

  :global(.border-bottom-c) {
    border-bottom: 1px solid var(--border-color);
  }
</style>
