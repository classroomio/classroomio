<script>
  import { flexible, leftFist, rightFist, robotArm, thumbsUp } from '$lib/emojis';

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

<section {id} class="w-full border-x-0 border-t-0 border-b border-gray-200 py-32">
  <div
    class="mx-auto flex w-4/5 flex-col {rightToLeft
      ? 'lg:flex-row-reverse'
      : 'lg:flex-row'} items-center justify-between gap-8 lg:gap-28"
  >
    <div class="flex w-[80vw] flex-col">
      <div class="my-2 ml-1 flex items-center gap-2 lg:my-4">
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
      <h2 class="mb-3 text-3xl lg:mb-6">{title}</h2>
      <p class="text-lg leading-8 text-gray-500">
        {description}
      </p>
      {#if more}
        <br />

        <p class="text-lg leading-8 text-gray-500">
          {@render more?.()}
        </p>
      {/if}
    </div>
    <div class="w-[80vw] md:w-[80vw] lg:w-full">
      <video
        width="100%"
        height="100%"
        class="h-auto w-full rounded-md shadow-xl lg:max-h-[80%]"
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
  </div>
</section>
