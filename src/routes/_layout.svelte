<script context="module">
  export function preload(page, { config }) {
    return { config };
  }
</script>

<script>
  import { onMount } from 'svelte';
  import { derived } from 'svelte/store';
  import { stores, goto } from '@sapper/app';
  import * as Sentry from '@sentry/browser';
  import { Firework } from 'svelte-loading-spinners';
  import Tailwindcss from '../components/Tailwindcss.svelte';
  import Navigation from '../components/Navigation/index.svelte';
  import Snackbar from '../components/Snackbar/index.svelte';
  import Backdrop from '../components/Backdrop/index.svelte';
  // import SideBar from "../components/SideBar/index.svelte";
  // import Footer from '../components/Footer/index.svelte';
  import Apps from '../components/Apps/index.svelte';
  import { handleAuthChange } from '../utils/functions/api';
  import { user, profile } from '../utils/store/user';
  import { getSupabase } from '../utils/functions/supabase';
  import { isMobile } from '../utils/store/useMobile';
  import { ROUTES_TO_HIDE_NAV, ROUTE } from '../utils/constants/routes';

  export let segment;
  export let config;

  let { page, preloading } = stores();

  let supabase = getSupabase(config);
  let path = $page.path.replace('/', '');

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
      .select(`*, org:organizationmember(*)`)
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

      // If user coming to login page, then
      if (!$profile.role) {
        goto(ROUTE.ONBOARDING);
      } else {
        goto('/dashboard');
      }
    }
  }

  function isCoursePage(path) {
    return /course[s]*\/[a-z 0-9 -]/.test(path);
  }

  function handleResize() {
    isMobile.update(() => window.innerWidth <= 760);
  }

  onMount(() => {
    console.log('Welcome to ClassroomIO, we are grateful you chose us.');
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
</script>

<svelte:window on:resize={handleResize} />
<Tailwindcss />

<!-- <Nav {segment} /> -->
<Snackbar />

<main>
  {#if $preloading && $delayedPreloading}
    <Backdrop>
      <Firework size="60" color="#1d4ed8" unit="px" duration="1s" />
    </Backdrop>
  {/if}
  {#if !ROUTES_TO_HIDE_NAV.includes($page.path) && !isCoursePage(path)}
    <Navigation {segment} />
  {/if}

  <div class="flex justify-between">
    <slot />

    {#if path.includes('courses')}
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
</style>
