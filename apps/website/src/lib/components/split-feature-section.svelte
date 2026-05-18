<script>
  /**
   * Two-column feature split — text + optional bullets on one side, image on the other.
   * Replaces bespoke per-page splits so we keep grid + spacing consistent across marketing pages.
   *
   * @typedef {Object} Props
   * @property {string} [eyebrow]
   * @property {string} title
   * @property {string} description
   * @property {string} imageSrc
   * @property {string} imageAlt
   * @property {string} [imageAspect]               Tailwind aspect class (default "aspect-[4/3]")
   * @property {'left'|'right'} [imagePosition]     (default "right")
   * @property {string} [bgClass]                   Section background (default "bg-white")
   * @property {import('svelte').Snippet} [bullets] Snippet rendering `<li>` children
   */

  /** @type {Props} */
  let {
    eyebrow,
    title,
    description,
    imageSrc,
    imageAlt,
    imageAspect = 'aspect-[4/3]',
    imagePosition = 'right',
    bgClass = 'bg-white',
    bullets
  } = $props();
</script>

<section class="px-6 py-12 lg:px-12 lg:py-16 {bgClass}">
  <div class="mx-auto grid max-w-[1100px] grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-20">
    <div class={imagePosition === 'left' ? 'lg:order-2' : ''}>
      {#if eyebrow}
        <div class="mb-2 text-xs font-medium tracking-widest text-blue-700 uppercase">{eyebrow}</div>
      {/if}
      <h2 class="text-[clamp(1.75rem,2.6vw,2.2rem)] leading-[1.15] font-medium tracking-tight">{title}</h2>
      <p class="mt-5 text-base leading-relaxed text-gray-500">{description}</p>
      {#if bullets}
        <ul class="mt-6 space-y-3 text-sm text-gray-700">
          {@render bullets()}
        </ul>
      {/if}
    </div>
    <div class="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-200 {imageAspect}">
      <img src={imageSrc} alt={imageAlt} class="h-full w-full object-cover" loading="lazy" />
    </div>
  </div>
</section>
