<script>
  /**
   * @typedef {Object} Props
   * @property {number} [index]
   * @property {import('svelte').Snippet} [children]
   */

  /** @type {Props} */
  let { index = 1, children } = $props();
  let duration = `${index + 10}`;
  let delay = `${index * 0.5}`;
</script>

<div
  class="group relative rounded transition-colors"
  style="--duration: {duration}; --delay: {delay};"
>
  <span>
    <span
      class="spark mask-gradient animate-flip before:animate-kitrotate absolute inset-0 h-full w-full overflow-hidden rounded [mask:linear-gradient(white,_transparent_50%)] before:absolute before:aspect-square before:w-[200%] before:rotate-[-90deg] before:dark:bg-[conic-gradient(from_0deg,transparent_0_340deg,white_360deg)] before:bg-[conic-gradient(from_0deg,black_360deg,transparent_0_340deg)] before:content-[''] before:[inset:0_auto_auto_50%] before:[translate:-50%_-15%]"
    ></span>
  </span>
  <span
    class="backdrop absolute inset-px rounded bg-neutral-950 transition-colors"
    style="--duration: {duration}; --delay: {delay};"
  ></span>
  {@render children?.()}
</div>
