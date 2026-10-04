<script>
  import { BlurFade } from '@cio/ui/custom/animation/blurfade';
  import VideoPlaceholder from './video-placeholder.svelte';
  import Section from './ui/section.svelte';
  import SectionHeader from './ui/section-header.svelte';

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

{#snippet heading()}{title}{/snippet}

<Section class={bgClass}>
  <SectionHeader {eyebrow} eyebrowClass="text-blue-700" ledeClass="text-gray-500" lede={description} title={heading} />

  <BlurFade delay={0.1} once class="mt-14">
    <div class="relative mx-auto max-w-[920px]">
      <VideoPlaceholder {suggestedFile} />
    </div>
  </BlurFade>
</Section>
