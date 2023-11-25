<script>
  import {
    flexible,
    leftFist,
    rightFist,
    robotArm,
    thumbsUp,
  } from '$lib/emojis';

  export let id = '';
  export let rightToLeft = false;
  export let tagline = '';
  export let title = '';
  export let description = '';
  export let video = '';
  export let taglineIcon = '';
</script>

<section
  {id}
  class="w-full py-32 border-b border-x-0 border-t-0 border-gray-200"
>
  <div
    class="w-4/5 mx-auto flex flex-col {rightToLeft
      ? 'lg:flex-row-reverse'
      : 'lg:flex-row'} items-center justify-between gap-28"
  >
    <div class="w-[80vw] flex flex-col">
      <div class="my-4 ml-1 flex gap-2 items-center">
        {#if taglineIcon === 'simplified'}
          <img src={thumbsUp} alt="" class="w-7" />
        {:else if taglineIcon === 'flexible'}
          <img src={flexible} alt="" class="w-7" />
        {:else if taglineIcon === 'collaboration'}
          <div class="flex items-center">
            <img src={leftFist} alt="" class="w-6" />
            <img src={rightFist} alt="" class="w-6" />
          </div>
        {:else if taglineIcon === 'productivity'}
          <img src={robotArm} alt="" class="w-7" />
        {/if}
        <p class="font-medium text-md">{tagline}</p>
      </div>
      <h2 class="font-bold text-4xl mb-6">{title}</h2>
      <p class="leading-8 text-lg text-gray-500">
        {description}
      </p>
      {#if $$slots.more}
        <br />

        <p class="leading-8 text-lg text-gray-500">
          <slot name="more" />
        </p>
      {/if}
    </div>
    <div class="w-[95vw] md:w-[80vw] lg:w-full">
      <video
        class="w-full h-auto lg:max-h-[80%] rounded-xl shadow-xl"
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
