<script>
  import { PUBLIC_ANALYTICS_URL } from '$env/static/public';
  import { globalStore } from '$lib/utils/store/app';
  import { currentOrg } from '$lib/utils/store/org';

  let site = '';
  const BASE_URL =
    import.meta.env.MODE === 'development'
      ? 'http://localhost:3005/dashboard'
      : PUBLIC_ANALYTICS_URL;

  $: site = $currentOrg.name || '';
</script>

{#if site != ''}
  {#key $globalStore.isDark}
    <iframe
      src={`${BASE_URL}?site=${site}&theme=${$globalStore.isDark}`}
      width="100%"
      height="100%"
      frameborder="0"
      scrolling="yes"
      title="Analytics Dashboard"
    ></iframe>
  {/key}
{:else}
  <div class="flex items-center">
    <p>LOADING ANALYTICS...</p>
  </div>
{/if}
