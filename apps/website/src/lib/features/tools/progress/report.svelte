<script lang="ts">
  import { htmlBody, nodeStore, openModal } from './store';

  import { derived } from 'svelte/store';

  const colorMap = {
    blue_tetiary_background: '#0542CC',
    blue_secondary_background: '#0542CC',
    blue_primary_background: '#0542CC',
    purple_tetiary_background: '#9D4EDD',
    purple_secondary_background: '#9D4EDD',
    purple_primary_background: '#9D4EDD',
    black_tetiary_background: '#252525',
    black_secondary_background: '#252525',
    black_primary_background: '#252525',
    yellow_tetiary_background: '#FFBC42',
    yellow_secondary_background: '#FFBC42',
    yellow_primary_background: '#FFBC42'
  };

  type ColorMapKey = keyof typeof colorMap;

  const backgroundColor = derived(htmlBody, ($htmlBody) => {
    return colorMap[$htmlBody.background as ColorMapKey] || '#1e5ed2';
  });

  let node: any;

  $effect(() => {
    nodeStore.set(node);
  });

  let rootBgImage = $derived(`https://assets.cdn.clsrio.com/progress-report/backgrounds/${
    $htmlBody.background || 'blue_tetiary_background'
  }.webp`);
</script>

<div
  class="h-full min-h-[500px] max-h-[500px] md:h-[60vh] w-full border relative flex items-center justify-center"
  style={`font-family: "Space Grotesk", sans-serif;  background-image: url('${rootBgImage}'); background-size: cover; background-repeat: no-repeat`}
  bind:this={node}
>
  <!-- fullscreen button -->
  {#if $openModal.showFullscreenButton}
    {#if $openModal.fullscreen}
      <button
        type="button"
        onclick={() => ($openModal.fullscreen = !$openModal.fullscreen)}
        class="absolute top-4 right-4 p-1.5 rounded-full hover:scale-90 transition-all duration-300 bg-white"
      >
        <img src="/free-tools/progress-report/close-icon.svg" alt="" class="" />
      </button>
    {:else}
      <button
        type="button"
        onclick={() => ($openModal.fullscreen = !$openModal.fullscreen)}
        class="absolute top-4 right-4 w-7 hover:scale-90 transition-all duration-300"
      >
        <img src="/free-tools/progress-report/full-screen-icon.svg" alt="" class="" />
      </button>
    {/if}
  {/if}

  <div class="mt-20">
    <!-- using both md & lg for the width here because the lib doesn't consider md to be medium screens and above, using md alone will make the output break on desktop so i had to also specify for large screens -->
    <div
      class="rounded-lg shadow-md bg-white border-4 border-gray-100 z-20 mx-auto flex justify-center items-center w-[16rem] h-[16rem]"
    >
      <div class="relative w-full h-full flex flex-col justify-center gap-3 items-center px-2">
        <!-- avatar -->
        <img
          src={`https://assets.cdn.clsrio.com/progress-report/avatar/${
            $htmlBody.avatar || 'avatar_a'
          }.svg`}
          alt=""
          class="absolute top-0 w-[25%] h-[25%] ml-2 -mt-[2.2rem]"
        />

        <!-- mood -->
        {#if $htmlBody.name || $htmlBody.mood.text}
          <div
            style="background-color: {$backgroundColor}; color: white; display: flex;"
            class="px-3 py-0.5 border border-[#EDEDED] rounded-2xl mt-6 md:mt-3 font-semibold text-[10px] md:text-[0.7rem] flex items-center justify-between"
          >
            <span class="mr-0.5">{$htmlBody.name}</span>

            {#if $htmlBody.mood.text}
              <span class="flex gap-1 items-center">
                <p class="font-semibold text-[10px] md:text-[0.7rem]">
                  is {$htmlBody.mood.text}
                </p>
                <img
                  src="https://assets.cdn.clsrio.com/progress-report/emojis/{$htmlBody.mood
                    .iconSrc}.png"
                  alt={$htmlBody.mood.text}
                  class="w-3"
                />
              </span>
            {/if}
          </div>
        {:else}
          <p
            style="background-color: {$backgroundColor}"
            class="px-3 py-0.5 border border-[#EDEDED] text-white rounded-2xl mt-3 font-medium text-[9px]"
          >
            Add your name
          </p>
        {/if}

        <!-- learning -->
        <span
          class="w-full md:my-2 p-1 overflow-hidden text-[0.7rem] md:text-[0.8rem] font-normal text-center outline-none h-[10vh] md:h-[12vh]"
        >
          {$htmlBody.learning}
        </span>

        <!-- progress -->
        <div class="flex flex-col justify-center items-center mb-2 md:mb-0">
          <div class="border border-[#d9e0f5] w-full h-4 rounded-full p-0.5 bg-[#f1f6ff]">
            <div
              class="progress-range rounded-full w-full h-full"
              style="background: {$backgroundColor}; width: {$htmlBody.progress}%"
></div>
          </div>
          <p class="text-[12px] font-semibold mt-1">Progress Achieved: {$htmlBody.progress}%</p>
        </div>
      </div>
    </div>

    <div
      style="display: flex;"
      class="border mt-20 bottom-5 w-[50%] mx-auto flex gap-1 items-center justify-center bg-white rounded-md px-2 py-1"
    >
      <img src="/logo-192.png" alt="classroomio logo" class="w-4" />
      <p class="text-[10px] font-bold">ClassroomIO.com</p>
    </div>
    <!--  -->
  </div>
</div>

<!-- importing font family -->
<style>
  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300..700&display=swap');
</style>
