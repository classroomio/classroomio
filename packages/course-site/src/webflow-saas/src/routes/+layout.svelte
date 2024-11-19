<script>
  import { run } from 'svelte/legacy';

  import { browser } from '$app/environment';
  import { isDark } from '$lib/component/store';
  import { toggleBodyByMode } from '$lib/utils/toggleMode';
  import '../app.css';
  /**
   * @typedef {Object} Props
   * @property {import('svelte').Snippet} [children]
   */

  /** @type {Props} */
  let { children } = $props();

  run(() => {
    if (browser) {
      const mode = localStorage.getItem('mode');
      $isDark = mode == '' ? false : true;
      toggleBodyByMode($isDark);
    }
  });
</script>

<svelte:head>
  <title>Webflow saas landing page</title>
</svelte:head>

{@render children?.()}
