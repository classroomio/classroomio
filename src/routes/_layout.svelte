<script context="module">
  export function preload(page, { config }) {
    return { config };
  }
</script>

<script>
  import { onMount } from 'svelte';
  import { stores, goto } from '@sapper/app';
  import Tailwindcss from '../components/Tailwindcss.svelte';
  import Navigation from '../components/Navigation/index.svelte';
  // import SideBar from "../components/SideBar/index.svelte";
  import Footer from '../components/Footer/index.svelte';
  import Apps from '../components/Apps/index.svelte';
  import { handleAuthChange } from '../utils/functions/api';
  import { user, profile } from '../utils/store/user';
  import { getSupabase } from '../utils/functions/supabase';

  export let segment;
  export let config;

  let supabase = getSupabase(config);
  let { page } = stores();
  let path = $page.path.replace('/', '');

  async function getProfile() {
    // Get user profile
    const authUser = supabase.auth.user();

    // Check if user has profile
    let {
      data: profileData,
      error,
      status,
    } = await supabase
      .from('profile')
      .select(`*`)
      .eq('user_id', authUser.id)
      .single();

    if (error && !profileData && status === 406) {
      // User wasn't found, create profile

      const { data, error } = await supabase
        .from('profile')
        .insert([{ user_id: authUser.id }]);

      // Profile created, go to profile page
      if (!error && data) {
        user.set(authUser);
        profile.set(data);
        return goto('/');
      }
    } else if (profileData) {
      // Profile exists, go to profile page
      user.set(authUser);
      profile.set(profileData);
      return goto('/');
    }
  }

  onMount(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        handleAuthChange(event, session);

        if (event === 'SIGNED_IN') {
          getProfile();
        } else {
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
  {#if !['login', 'signup', ''].includes(path)}
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
  <Footer {segment} />
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
