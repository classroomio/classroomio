<script>
  import PlayCircle from '@lucide/svelte/icons/play-circle';

  /**
   * @typedef {Object} Props
   * @property {string} suggestedFile    Suggested static path (e.g. "/compliance-demo.mp4")
   * @property {string} [caption]        Optional short description
   * @property {string} [className]      Extra classes
   */

  /** @type {Props} */
  let { suggestedFile, caption = '', className = '' } = $props();
</script>

<div
  class="relative aspect-video w-full overflow-hidden rounded-2xl border-2 border-dashed border-blue-300 bg-gradient-to-br from-blue-50 via-white to-gray-100 {className}"
>
  <div class="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center">
    <div
      class="flex h-20 w-20 items-center justify-center rounded-full bg-white text-blue-700 shadow-lg ring-1 ring-blue-100"
    >
      <PlayCircle size={48} strokeWidth={1.4} />
    </div>
    <p class="text-sm font-medium text-gray-700">Video placeholder</p>
    <p class="text-xs text-gray-500">Replace with HeroVideoDialog · suggested file: {suggestedFile}</p>
    {#if caption}
      <p class="max-w-[80%] text-[11px] text-gray-400">{caption}</p>
    {/if}
  </div>
</div>
