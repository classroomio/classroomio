<script>
  import { page } from '$app/stores';
  import Navigation from '$lib/Navigation/Navigation.svelte';
  import Footer from '$lib/Footer/Footer.svelte';
  import PageTransition from './transition.svelte';
  import NotFound from '$lib/NotFound/NotFound.svelte';

  import '../app.css';

  export let data;
</script>

<div class="overflow-hidden">
  <Navigation />

  <PageTransition url={data.url}>
    {#if $page.status === 404}
      <NotFound className="mt-5" />
    {:else}
      <slot />
    {/if}
  </PageTransition>

  <Footer />
</div>
