<script>
  import { page } from '$app/stores';
  import { MetaTags } from 'svelte-meta-tags';
  import Navigation from '$lib/Navigation/Navigation.svelte';
  import Footer from '$lib/Footer/Footer.svelte';
  import PageTransition from './transition.svelte';
  import NotFound from '$lib/NotFound/NotFound.svelte';
  import extend from 'just-extend';

  import '../app.css';

  export let data;

  $: metaTags = extend(true, {}, data.baseMetaTags, $page.data.pageMetaTags);
</script>

<MetaTags {...metaTags} />

<div class="overflow-hidden bg-white">
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
