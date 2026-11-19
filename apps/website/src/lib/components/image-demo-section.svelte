<script>
  import { BlurFade } from '@cio/ui/custom/animation/blurfade';
  import ImagePlaceholder from './image-placeholder.svelte';
  import Section from './ui/section.svelte';
  import SectionHeader from './ui/section-header.svelte';

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

{#snippet heading()}{title}{/snippet}

<Section class={bgClass}>
  <SectionHeader {eyebrow} eyebrowClass="text-blue-700" ledeClass="text-gray-500" lede={description} title={heading} />

  <BlurFade delay={0.1} once class="mt-14">
    {#if imageSrc}
      <div class="overflow-hidden rounded-xl bg-white ring-1 ring-gray-200">
        <img src={imageSrc} alt={imageAlt} class="block h-auto w-full" loading="lazy" decoding="async" />
      </div>
    {:else}
      <ImagePlaceholder {suggestedFile} {caption} {aspect} />
    {/if}
  </BlurFade>
</Section>
