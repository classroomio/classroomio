<script>
  /** @type {{className?: string, children?: import('svelte').Snippet}} */
  let { className = '', children } = $props();
</script>

<header
  class="hero-bg lg:min-h-[30rem] mt-[10%] md:mt-16 pt-24 pb-16 w-full border-b border-slate-100 {className}"
>
  {@render children?.()}
</header>
