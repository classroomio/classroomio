<script>
  import { BlurFade } from '@cio/ui/custom/animation/blurfade';
  import VideoPlaceholder from './video-placeholder.svelte';

  /**
   * @typedef {Object} Props
   * @property {string} eyebrow              Eyebrow label (e.g. "A live walkthrough")
   * @property {string} title                Section heading
   * @property {string} [description]        Lead paragraph below the heading
   * @property {string} suggestedFile        Path passed through to VideoPlaceholder
   * @property {string} [bgClass]            Optional section background (default bg-gray-50)
   */

  /** @type {Props} */
  let { eyebrow, title, description, suggestedFile, bgClass = 'bg-gray-50' } = $props();
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
      <div class="relative mx-auto max-w-[920px]">
        <VideoPlaceholder {suggestedFile} />
      </div>
    </BlurFade>
  </div>
</section>
