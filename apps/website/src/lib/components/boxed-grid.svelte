<script>
  import { BlurFade } from '@cio/ui/custom/animation/blurfade';

  /**
   * Boxed grid of cards — one outer rounded border, internal dividers between cells.
   * Reused by RoiBand, AutomationBand, customer-ed outcomes, etc.
   *
   * @typedef {Object} Props
   * @property {any[]} items
   * @property {import('svelte').Snippet<[any, number]>} cell    Snippet that renders one cell's content
   * @property {2 | 3 | 4} [cols]                                Desktop column count (default 3)
   * @property {string} [bgClass]                                Background class for the container (default bg-white)
   * @property {string} [padding]                                Cell padding (default "p-6 lg:p-8")
   * @property {boolean} [animate]                               Wrap each cell in BlurFade (default true)
   */

  /** @type {Props} */
  let { items, cell, cols = 3, bgClass = 'bg-white', padding = 'p-6 lg:p-8', animate = true } = $props();

  const colsClass = {
    2: 'sm:grid-cols-2',
    3: 'sm:grid-cols-3',
    4: 'sm:grid-cols-4'
  }[cols];
</script>

<div class="grid grid-cols-1 overflow-hidden rounded-2xl border border-gray-200 {bgClass} {colsClass}">
  {#each items as item, i (i)}
    {#if animate}
      <BlurFade delay={0.05 * i} once>
        <div
          class="h-full border-gray-200 {padding}"
          class:border-t={i > 0}
          class:sm:border-l={i % cols !== 0}
          class:sm:border-t-0={i < cols}
          class:sm:border-t={i >= cols}
        >
          {@render cell(item, i)}
        </div>
      </BlurFade>
    {:else}
      <div
        class="h-full border-gray-200 {padding}"
        class:border-t={i > 0}
        class:sm:border-l={i % cols !== 0}
        class:sm:border-t-0={i < cols}
        class:sm:border-t={i >= cols}
      >
        {@render cell(item, i)}
      </div>
    {/if}
  {/each}
</div>
