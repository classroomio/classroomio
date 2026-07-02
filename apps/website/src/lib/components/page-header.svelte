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

<header class="relative w-full overflow-hidden border-b border-slate-100 pt-32 pb-16 lg:min-h-[20rem]">
  <DotPattern fillColor="rgb(2 51 189 / 0.25)" class="pointer-events-none absolute inset-0 h-full w-full" />
  <div class="relative z-10 {className}">
    {@render children?.()}
  </div>
</header>
