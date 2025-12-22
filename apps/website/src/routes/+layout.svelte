<script>
  import { dev } from '$app/environment';
  import { page } from '$app/state';
  import { Footer, Navigation, NotFound } from '$lib/components';
  import extend from 'just-extend';
  import { onMount } from 'svelte';
  import { MetaTags } from 'svelte-meta-tags';
  import PageTransition from './transition.svelte';

  import '../app.css';

  export let data;

  onMount(() => {
    if (dev) {
      localStorage.setItem('umami.disabled', '1');
    }
  });

  $: metaTags = extend(true, {}, data.baseMetaTags, page.data.pageMetaTags);
</script>

<MetaTags {...metaTags} />

<div class="overflow-hidden bg-white">
  <Navigation stars={data.stars} />

  <PageTransition url={data.url}>
    {#if page.status === 404}
      <NotFound className="mt-5" />
    {:else}
      <slot />
    {/if}
  </PageTransition>

  <Footer />
</div>
