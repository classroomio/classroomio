<script>
  import Section from './ui/section.svelte';
  import SectionHeader from './ui/section-header.svelte';

  /**
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

{#snippet heading()}{title}{/snippet}

<Section class={bgClass} innerClass="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-20">
  <div class={imagePosition === 'left' ? 'lg:order-2' : ''}>
    <SectionHeader
      align="left"
      size="h3"
      {eyebrow}
      eyebrowClass="text-blue-700"
      ledeClass="text-gray-500"
      lede={description}
      title={heading}
    />
    {#if bullets}
      <ul class="mt-8 space-y-3 text-[15px] leading-relaxed text-gray-700">
        {@render bullets()}
      </ul>
    {/if}
  </div>
  <div class="overflow-hidden rounded-xl bg-white ring-1 ring-gray-200 {imageAspect}">
    <img src={imageSrc} alt={imageAlt} class="h-full w-full object-cover" loading="lazy" />
  </div>
</Section>
