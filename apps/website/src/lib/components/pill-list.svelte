<script>
  import { BlurFade } from '@cio/ui/custom/animation/blurfade';

  /**
   * Wrap-flow list of pill-shaped bordered cards with an optional colored dot.
   * Used on solution pages for use-case lists, audience lists, etc.
   *
   * @typedef {Object} Props
   * @property {string[]} items
   * @property {boolean} [showDot]    Show a small pastel dot at the start of each pill (default true)
   * @property {boolean} [animate]    Wrap each pill in BlurFade (default true)
   * @property {string} [gap]         Gap class between pills (default "gap-3")
   * @property {string} [size]        Padding/text size variant: "default" | "compact" (default "default")
   */

  /** @type {Props} */
  let { items, showDot = true, animate = true, gap = 'gap-3', size = 'default' } = $props();

  const dotColors = [
    'bg-blue-300',
    'bg-emerald-300',
    'bg-amber-300',
    'bg-violet-300',
    'bg-rose-300',
    'bg-cyan-300',
    'bg-orange-300',
    'bg-fuchsia-300'
  ];

  const sizes = {
    default: 'px-4 py-2 text-sm',
    compact: 'px-3 py-1.5 text-xs'
  };
</script>

<div class="flex flex-wrap {gap}">
  {#each items as item, i}
    {#if animate}
      <BlurFade delay={0.03 * i} once>
        <span
          class="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white text-gray-800 {sizes[
            size
          ]}"
        >
          {#if showDot}
            <span class="h-2 w-2 rounded-full {dotColors[i % dotColors.length]}"></span>
          {/if}
          {item}
        </span>
      </BlurFade>
    {:else}
      <span
        class="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white text-gray-800 {sizes[size]}"
      >
        {#if showDot}
          <span class="h-2 w-2 rounded-full {dotColors[i % dotColors.length]}"></span>
        {/if}
        {item}
      </span>
    {/if}
  {/each}
</div>
