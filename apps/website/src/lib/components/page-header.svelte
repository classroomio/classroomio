<script>
  import { DotField } from '@cio/ui/custom/animation/dot-field';

  /**
   * @typedef {Object} Props
   * @property {string} [className]
   * @property {import('svelte').Snippet} [children]
   */

  /** @type {Props} */
  let { className = '', children } = $props();
</script>

<header class="relative w-full overflow-hidden border-b border-slate-100 pt-32 pb-16 lg:min-h-[20rem]">
  <DotField
    dotRadius={1.5}
    dotSpacing={14}
    cursorRadius={420}
    bulgeOnly={true}
    bulgeStrength={56}
    glowRadius={140}
    sparkle={false}
    waveAmplitude={0}
    class="pointer-events-none absolute inset-0 h-full w-full"
  />
  <div class="relative z-10 {className}">
    {@render children?.()}
  </div>
</header>
