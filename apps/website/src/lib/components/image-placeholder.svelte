<script>
  import Image from '@lucide/svelte/icons/image';

  /**
   * @typedef {Object} Props
   * @property {string} suggestedFile    Suggested static path (e.g. "/static/foo.png")
   * @property {string} [caption]        Short description of what should go here
   * @property {string} [aspect]         Tailwind aspect class (default "aspect-[4/3]")
   * @property {string} [className]      Extra classes
   */

  /** @type {Props} */
  let { suggestedFile, caption = '', aspect = 'aspect-[4/3]', className = '' } = $props();
</script>

<div
  class="relative flex w-full flex-col items-center justify-center gap-3 overflow-hidden rounded-2xl border-2 border-dashed border-blue-300 bg-gradient-to-br from-blue-50 via-white to-gray-100 p-6 text-center {aspect} {className}"
>
  <div
    class="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-blue-700 shadow ring-1 ring-blue-100"
  >
    <Image size={26} strokeWidth={1.6} />
  </div>
  <p class="text-sm font-medium text-gray-700">Image placeholder</p>
  <p class="text-xs text-gray-500">Suggested: {suggestedFile}</p>
  {#if caption}
    <p class="max-w-[80%] text-[11px] text-gray-400">{caption}</p>
  {/if}
</div>
