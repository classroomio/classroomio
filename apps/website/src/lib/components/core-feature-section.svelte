<script>
  import { flexible, leftFist, rightFist, robotArm, thumbsUp } from '$lib/emojis';
  import Section from './ui/section.svelte';

  /**
   * @typedef {Object} Props
   * @property {string} [id]
   * @property {boolean} [rightToLeft]
   * @property {string} [tagline]
   * @property {string} [title]
   * @property {string} [description]
   * @property {string} [video]
   * @property {string} [taglineIcon]
   * @property {import('svelte').Snippet} [more]
   */

  /** @type {Props} */
  let {
    id = '',
    rightToLeft = false,
    tagline = '',
    title = '',
    description = '',
    video = '',
    taglineIcon = '',
    more
  } = $props();
</script>

<Section
  {id}
  class="border-x-0 border-t-0 border-b border-gray-200"
  innerClass="flex flex-col {rightToLeft
    ? 'lg:flex-row-reverse'
    : 'lg:flex-row'} items-center justify-between gap-12 lg:gap-20"
>
  <div class="flex w-full flex-col lg:flex-1">
    <div class="mb-4 flex items-center gap-2">
      {#if taglineIcon === 'simplified'}
        <img width="27" height="27" loading="lazy" src={thumbsUp} alt="" class="w-7" />
      {:else if taglineIcon === 'flexible'}
        <img width="27" height="27" loading="lazy" src={flexible} alt="" class="w-7" />
      {:else if taglineIcon === 'collaboration'}
        <div class="flex items-center">
          <img width="24" height="24" loading="lazy" src={leftFist} alt="" class="w-6" />
          <img width="24" height="24" loading="lazy" src={rightFist} alt="" class="w-6" />
        </div>
      {:else if taglineIcon === 'productivity'}
        <img width="27" height="27" loading="lazy" src={robotArm} alt="" class="w-7" />
      {/if}
      <p class="text-base font-medium">{tagline}</p>
    </div>
    <h2 class="text-h3 text-balance">{title}</h2>
    <p class="text-lead mt-[18px] text-pretty text-gray-500">
      {description}
    </p>
    {#if more}
      <br />

      <p class="text-lead text-pretty text-gray-500">
        {@render more?.()}
      </p>
    {/if}
  </div>
  <div class="w-full lg:flex-1">
    <video
      width="100%"
      height="100%"
      class="h-auto w-full rounded-xl border border-gray-200 lg:max-h-[80%]"
      autoplay
      loop
      muted
      defaultMuted
      playsinline
      preload="auto"
    >
      <source src={video} type="video/mp4" />
      <track kind="captions" />
    </video>
  </div>
</Section>
