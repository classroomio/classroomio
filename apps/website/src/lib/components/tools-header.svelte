<script>
  import { DotPattern } from '@cio/ui/custom/animation/dot-pattern';

  /**
   * @typedef {Object} Props
   * @property {string} [className]
   * @property {import('svelte').Snippet} [children]
   */

  /** @type {Props} */
  let { className = '', children } = $props();
</script>

<header
  class="relative px-6 py-20 text-center md:px-10 md:py-28 {className} overflow-hidden border-b border-slate-100 bg-white"
>
  <DotPattern fillColor="rgb(2 51 189 / 0.25)" class="absolute inset-0 h-full w-full" />
  <div class="relative z-10">
    {@render children?.()}
  </div>
</header>
