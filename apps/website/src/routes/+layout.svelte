<script lang="ts">
  import { dev } from '$app/environment';
  import { page } from '$app/state';
  import { Footer, Navigation, NotFound } from '$lib/components';
  import { initUserJot } from '$lib/utils/userjot';
  import extend from 'just-extend';
  import { onMount } from 'svelte';
  import { MetaTags } from 'svelte-meta-tags';

  import '../app.css';

  let { children, data } = $props();

  onMount(() => {
    if (dev) {
      localStorage.setItem('umami.disabled', '1');
      return;
    }

    initUserJot();
  });

  let metaTags = $derived(extend(true, {}, data.baseMetaTags, page.data.pageMetaTags));
</script>

<MetaTags {...metaTags} />

<div class="overflow-hidden bg-white">
  <Navigation stars={data.stars} />

  {#if page.status === 404}
    <NotFound className="mt-5" />
  {:else}
    {@render children?.()}
  {/if}

  <Footer />
</div>
