<script context="module">
  export function preload(page, { config }) {
    return { config, isMvpUser: !!page.query.mvp };
  }
</script>

<script>
  import { onMount } from 'svelte';
  import { stores, goto } from '@sapper/app';
  import Tailwindcss from '../components/Tailwindcss.svelte';
  import Navigation from '../components/Navigation/index.svelte';
  // import SideBar from "../components/SideBar/index.svelte";
  // import Footer from '../components/Footer/index.svelte';
  // import Apps from '../components/Apps/index.svelte';
  import { handleAuthChange } from '../utils/functions/api';
  import { user, profile } from '../utils/store/user';
  import { getSupabase } from '../utils/functions/supabase';
  import { setProfileIdOfGroupMember } from '../utils/services/courses';

  export let segment;
  export let config;
  export let isMvpUser;

  let supabase = getSupabase(config);
  let { page } = stores();
  let path = $page.path.replace('/', '');
  let allowUser = false;

  async function getProfile() {
    console.log('Get user profile');
    // Get user profile
    const authUser = supabase.auth.user();

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
        username: regexUsernameMatch[1],
        fullname: regexUsernameMatch[1],
        email: authUser.email,
      });

      // Profile created, go to profile page
      if (!error && data) {
        $user.fetchingUser = false;
        $user.isLoggedIn = true;
        $user.currentSession = authUser;

        profile.set(data[0]);
        await setProfileIdOfGroupMember(authUser.email, data[0].id);

        // If user coming to login page, then
        if (path.includes('login') || path.includes('signup')) {
          goto('/dashboard');
        }
      }
    } else if (profileData) {
      // Profile exists, go to profile page
      $user.fetchingUser = false;
      $user.isLoggedIn = true;
      $user.currentSession = authUser;
      console.log(`profileData`, profileData);
      profile.set(profileData);

      setProfileIdOfGroupMember(authUser.email, profileData.id);

      // If user coming to login page, then
      if (path.includes('login') || path.includes('signup')) {
        goto('/dashboard');
      }
    }
  }

  onMount(() => {
    const _isMvpUser = localStorage.getItem('mvp');

    console.log('mounting layout', isMvpUser, path, _isMvpUser);
    if (isMvpUser || window.location.search.includes('mvp')) {
      localStorage.setItem('mvp', 'true');
      allowUser = true;
    } else if (!_isMvpUser) {
      if (!!path) {
        goto('/');
      }

      return;
    }

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (config.isDev) {
          handleAuthChange(event, session);
        }

        if (event === 'SIGNED_IN') {
          $user.fetchingUser = true;
          getProfile();
        } else {
          console.log('not logged in, go to login');
          return goto('/');
        }
      }
    );

    return () => {
      authListener.unsubscribe();
    };
  });

  $: path = $page.path.replace('/', '');
</script>

<Tailwindcss />

<!-- <Nav {segment} /> -->

<main>
  {#if !['login', 'signup'].includes(path)}
    <Navigation {segment} disableLogin={!allowUser} />
  {/if}

  <div class="flex justify-between">
    <slot />

    <!-- {#if path.includes('courses')}
      <Apps />
    {/if} -->
  </div>
</main>

{#if !['about', ''].includes(path)}
  <!-- <Footer {segment} /> -->
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
  }
</style>
