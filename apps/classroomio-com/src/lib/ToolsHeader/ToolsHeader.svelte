<script>
  /** @type {{className?: string, children?: import('svelte').Snippet}} */
  let { className = '', children } = $props();
</script>

<header class="tools-hero-bg text-center py-14 {className} border-b border-slate-100 bg-white">
  {@render children?.()}
</header>
