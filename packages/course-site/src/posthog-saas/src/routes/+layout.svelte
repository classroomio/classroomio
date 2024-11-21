<script>
  import '../app.css';

  /** @type {{children?: import('svelte').Snippet}} */
  let { children } = $props();
</script>

<svelte:head>
  <title>Posthog saas landing page</title>
</svelte:head>

{@render children?.()}
