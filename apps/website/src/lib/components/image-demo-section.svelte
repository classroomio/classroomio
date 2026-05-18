<script>
  import { BlurFade } from '@cio/ui/custom/animation/blurfade';
  import ImagePlaceholder from './image-placeholder.svelte';

  /**
   * Heading row + full-width image preview. Renders a real image when `imageSrc` is set,
   * otherwise drops back to `ImagePlaceholder` so unstaged sections still surface the gap.
   *
   * @typedef {Object} Props
   * @property {string} eyebrow
   * @property {string} title
   * @property {string} [description]
   * @property {string} [imageSrc]        Real image path (omit to render placeholder).
   * @property {string} [imageAlt]
   * @property {string} [suggestedFile]   Required when `imageSrc` is omitted.
   * @property {string} [caption]
   * @property {string} [aspect]          Tailwind aspect class (default "aspect-[16/9]")
   * @property {string} [bgClass]         (default "bg-gray-50")
   */

  /** @type {Props} */
  let {
    eyebrow,
    title,
    description,
    imageSrc,
    imageAlt = '',
    suggestedFile,
    caption = '',
    aspect = 'aspect-[16/9]',
    bgClass = 'bg-gray-50'
  } = $props();
</script>

<section class="px-6 py-12 lg:px-12 lg:py-16 {bgClass}">
  <div class="mx-auto max-w-[1100px]">
    <div class="mb-10 max-w-[620px]">
      <div class="mb-2 text-xs font-medium tracking-widest text-blue-700 uppercase">{eyebrow}</div>
      <h2 class="text-[clamp(1.75rem,2.6vw,2.2rem)] leading-[1.15] font-medium tracking-tight">{title}</h2>
      {#if description}
        <p class="mt-5 text-base leading-relaxed text-gray-500">{description}</p>
      {/if}
    </div>

    <BlurFade delay={0.1} once>
      <div class="mx-auto max-w-[1100px]">
        {#if imageSrc}
          <div class="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-200">
            <img src={imageSrc} alt={imageAlt} class="block h-auto w-full" loading="lazy" decoding="async" />
          </div>
        {:else}
          <ImagePlaceholder {suggestedFile} {caption} {aspect} />
        {/if}
      </div>
    </BlurFade>
  </div>
</section>
