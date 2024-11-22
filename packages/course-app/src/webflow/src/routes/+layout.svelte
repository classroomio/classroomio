<script>
  import '../app.css';
  /**
   * @typedef {Object} Props
   * @property {import('svelte').Snippet} [children]
   */

  /** @type {Props} */
  let { children } = $props();
</script>

<svelte:head>
  <title>Webflow saas landing page</title>
</svelte:head>

{@render children?.()}
