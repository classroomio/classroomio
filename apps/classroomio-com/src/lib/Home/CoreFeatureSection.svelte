<script>
  import { flexible, leftFist, rightFist, robotArm, thumbsUp } from '$lib/emojis';

  /** @type {{id?: string, rightToLeft?: boolean, tagline?: string, title?: string, description?: string, video?: string, taglineIcon?: string, more?: import('svelte').Snippet}} */
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

<section {id} class="w-full py-32 border-b border-x-0 border-t-0 border-gray-200">
  <div
    class="w-4/5 mx-auto flex flex-col {rightToLeft
      ? 'lg:flex-row-reverse'
      : 'lg:flex-row'} items-center justify-between gap-8 lg:gap-28"
  >
    <div class="w-[80vw] flex flex-col">
      <div class="my-2 lg:my-4 ml-1 flex gap-2 items-center">
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
        <p class="font-medium text-base">{tagline}</p>
      </div>
      <h2 class="font-bold text-4xl mb-3 lg:mb-6">{title}</h2>
      <p class="leading-8 text-lg text-gray-500">
        {description}
      </p>
      {#if more}
        <br />

        <p class="leading-8 text-lg text-gray-500">
          {@render more?.()}
        </p>
      {/if}
    </div>
    <div class="w-[80vw] md:w-[80vw] lg:w-full">
      <video
        width="100%"
        height="100%"
        class="w-full h-auto lg:max-h-[80%] rounded-md shadow-xl"
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
