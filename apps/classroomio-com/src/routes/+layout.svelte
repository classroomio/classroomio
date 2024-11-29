<script>
  import { page } from '$app/stores';
  import { MetaTags } from 'svelte-meta-tags';
  import Navigation from '$lib/Navigation/Navigation.svelte';
  import Footer from '$lib/Footer/Footer.svelte';
  import PageTransition from './transition.svelte';
  import NotFound from '$lib/NotFound/NotFound.svelte';
  import extend from 'just-extend';
  import { dev } from '$app/environment';
  import { onMount } from 'svelte';

  import '../app.css';

  export let data;

  let isDarkMode = false;

  onMount(() => {
    if (dev) {
      localStorage.setItem('umami.disabled', '1');
    }
    
    // Check for user's preference
    if (typeof window !== 'undefined') {
      isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
      updateTheme();
    }
  });

  function updateTheme() {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }

  function toggleDarkMode() {
    isDarkMode = !isDarkMode;
    updateTheme();
  }

  $: metaTags = extend(true, {}, data.baseMetaTags, $page.data.pageMetaTags);
</script>

<MetaTags {...metaTags} />

<div class="overflow-hidden bg-primary text-primary transition-colors duration-300">
  <Navigation />

  <button 
    on:click={toggleDarkMode} 
    class="fixed top-4 right-4 z-50 p-2 bg-secondary text-primary rounded-full"
  >
    {isDarkMode ? '☀️' : '🌙'}
  </button>

  <PageTransition url={data.url}>
    {#if $page.status === 404}
      <NotFound className="mt-5" />
    {:else}
      <slot />
    {/if}
  </PageTransition>

  <Footer />
</div>
