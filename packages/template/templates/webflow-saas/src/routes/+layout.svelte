<script>
  import { browser } from '$app/environment';
  import { isDark } from '$lib/component/store';
  import { toggleBodyByMode } from '$lib/utils/toggleMode';
  import '../app.css';

  $: {
    if (browser) {
      const mode = localStorage.getItem('mode');
      $isDark = mode == '' ? false : true;
      toggleBodyByMode($isDark);
    }
  }
</script>

<svelte:head>
  <title>Posthog saas landing page</title>
</svelte:head>

<slot />
