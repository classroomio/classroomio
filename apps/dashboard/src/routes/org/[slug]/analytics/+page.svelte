<script>
  import { PUBLIC_ANALYTICS_URL } from '$env/static/public';
  import { globalStore } from '$lib/utils/store/app';
  import { currentOrg } from '$lib/utils/store/org';
  import { Renew } from 'carbon-icons-svelte';

  const BASE_URL =
    import.meta.env.MODE === 'development'
      ? 'http://localhost:3005/dashboard'
      : PUBLIC_ANALYTICS_URL;

  $: site = $currentOrg.name || '';
  $: URL_PARAMS = `?site=${site}&theme=${$globalStore.isDark.toString()}`;
</script>

{#if site != ''}
  {#key $globalStore.isDark}
    <iframe
      src={`${BASE_URL}${URL_PARAMS}`}
      width="100%"
      height="100%"
      frameborder="0"
      scrolling="yes"
      title="Analytics Dashboard"
    ></iframe>
  {/key}
{:else}
  <div class="flex items-center justify-center gap-2 w-full h-full">
    <p class="text-sm">LOADING ANALYTICS</p>
    <div class="animate-spin">
      <Renew />
    </div>
  </div>
{/if}
