<script context="module">
  export function preload(page, { config }) {
    return { config };
  }
</script>

<script>
  import { onMount } from 'svelte';
  import { derived } from 'svelte/store';
  import { stores, goto } from '@sapper/app';
  import isEmpty from 'lodash/isEmpty';
  import mixpanel from 'mixpanel-browser';
  // import * as Sentry from '@sentry/browser';
  import { Theme } from 'carbon-components-svelte';
  import { Moon } from 'svelte-loading-spinners';
  import Tailwindcss from '../components/Tailwindcss.svelte';
  import LandingNavigation from '../components/Navigation/index.svelte';
  import OrgNavigation from '../components/Navigation/app.svelte';
  import LMSNavigation from '../components/Navigation/lms.svelte';
  import OrgLandingPage from '../components/Org/LandingPage/index.svelte';
  import Snackbar from '../components/Snackbar/index.svelte';
  import Backdrop from '../components/Backdrop/index.svelte';
  import OrgSideBar from '../components/Org/SideBar.svelte';
  import LMSSideBar from '../components/LMS/SideBar.svelte';
  // import SideBar from "../components/SideBar/index.svelte";
  // import Footer from '../components/Footer/index.svelte';
  import Apps from '../components/Apps/index.svelte';
  import PlayQuiz from '../components/Org/Quiz/Play/index.svelte';
  import {
    isCoursesPage,
    isOrgPage,
    isLMSPage,
    isQuizPage,
  } from '../utils/functions/app';
  import showAppsSideBar from '../utils/functions/showAppsSideBar';
  import { user, profile } from '../utils/store/user';
  import { getSupabase } from '../utils/functions/supabase';
  import { isMobile } from '../utils/store/useMobile';
  import { ROUTES_TO_HIDE_NAV, ROUTE } from '../utils/constants/routes';
  import { getOrganizations, getCurrentOrg } from '../utils/services/org';
  import { toggleBodyByTheme } from '../utils/functions/app';
  import { appStore } from '../utils/store/app';
  import { currentOrg } from '../utils/store/org';
  import { blockedSubdomain } from '../utils/constants/app';

  export let segment;
  export let config;

  // MIXPANEL
  mixpanel.init(config.mixpanelToken, { debug: !config.isProd });

  let { page, preloading } = stores();

  let supabase = getSupabase(config);
  let path = $page.path.replace('/', '');
  let theme = 'white';
  let skipAuth = false;

  const delayedPreloading = derived(preloading, (currentPreloading, set) => {
    setTimeout(() => set(currentPreloading), 250);
  });

  async function getProfile() {
    const params = new URLSearchParams(window.location.search);
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
        // Sentry.setUser($profile);
        // Set user in Mixpanel
        mixpanel.identify($profile.email);

        if ($appStore.isStudentDomain) {
          const { data, error } = await supabase
            .from('organizationmember')
            .insert({
              organization_id: $currentOrg.id,
              profile_id: $profile.id,
              role_id: 3,
            });
          if (error) {
            console.error('Error adding user to organisation', error);
          } else {
            console.log('Success adding user to organisation', data);
            const memberId = data?.[0]?.id || '';

            $currentOrg.memberId = memberId;
          }

          if (params.has('redirect')) {
            goto(params.get('redirect'));
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
      // Sentry.setUser($profile);
      if (config.isProd) {
        // Set user in Mixpanel
        mixpanel.identify($profile.email);
      }

      const orgRes = await getOrganizations($profile.id);

      // student redirect
      if ($appStore.isStudentDomain) {
        if (params.has('redirect')) {
          goto(params.get('redirect'));
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
      }
    }
  }

  function setOrgBasedOnUrl(host) {
    if (typeof window !== 'undefined') {
      const debug = localStorage.getItem('role') === 'student';
      const matches = host.match(/([a-z0-9]+).*classroomio[.]com/);
      const subdomain = matches?.[1] ?? '';

      if (!blockedSubdomain.includes(subdomain)) {
        const answer = Array.isArray(matches)
          ? !!subdomain && subdomain !== 'www'
          : false;

        $appStore.isStudentDomain = debug || answer;
        $appStore.siteNameFromDomain = debug ? 'codingdojo' : subdomain;
      }
      skipAuth = debug || subdomain === 'play';
    }
  }

  function handleResize() {
    isMobile.update(() => window.innerWidth <= 760);
  }

  onMount(() => {
    console.log(
      'Welcome to ClassroomIO, we are grateful you chose us.',
      $page.host,
      `\nIs student domain: ${$appStore.isStudentDomain}`
    );
    // Disable GA on localhost
    if (config && !config.isProd) {
      console.log('disable GA');
      window['ga-disable-G-C7WBN0S06R'] = true;
    }

    handleResize();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
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
        if (skipAuth) return;

        // Authentication Steps
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

    if ($appStore.isStudentDomain) {
      getCurrentOrg($appStore.siteNameFromDomain);
    }

    return () => {
      authListener.unsubscribe();
    };
  });

  $: path = $page.path.replace('/', '');
  $: theme = $appStore.isDark ? 'g100' : 'white';
  $: setOrgBasedOnUrl($page.host);
</script>

<svelte:window on:resize={handleResize} />

<svelte:head>
  <link href="/css/carbon.css" rel="stylesheet" />
</svelte:head>

<Theme bind:theme />
<Tailwindcss />

<Snackbar />

{#if skipAuth}
  <PlayQuiz />
{:else if $appStore.isStudentDomain && !path}
  <OrgLandingPage {segment} />
{:else}
  <main class="dark:bg-gray-800">
    {#if $preloading && $delayedPreloading}
      <Backdrop>
        <Moon size="60" color="#1d4ed8" unit="px" duration="1s" />
      </Backdrop>
    {/if}
    {#if !ROUTES_TO_HIDE_NAV.includes($page.path) && !isCoursesPage(path)}
      {#if isOrgPage($page.path) || $page.path.includes('profile')}
        <OrgNavigation />
      {:else if isLMSPage($page.path)}
        <LMSNavigation />
      {:else}
        <LandingNavigation
          {segment}
          logo={$appStore.isStudentDomain ? $currentOrg.avatar_url : undefined}
          orgName={$appStore.isStudentDomain ? $currentOrg.name : undefined}
        />
      {/if}
    {/if}

    <div class="flex justify-between">
      {#if isOrgPage($page.path)}
        <div class="org-root w-full flex items-center justify-between">
          {#if !isQuizPage($page.path)}
            <OrgSideBar />
          {/if}
          <div class="org-slot bg-white dark:bg-gray-800">
            <slot />
          </div>
        </div>
      {:else if isLMSPage($page.path)}
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
    <!-- <Footer {segment} /> -->
  {/if}
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
