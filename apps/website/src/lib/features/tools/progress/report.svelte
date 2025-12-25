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

  let rootBgImage = $derived(
    `https://assets.cdn.clsrio.com/progress-report/backgrounds/${
      $htmlBody.background || 'blue_tetiary_background'
    }.webp`
  );
</script>

<div
  class="relative flex h-full max-h-[500px] min-h-[500px] w-full items-center justify-center border md:h-[60vh]"
  style={`font-family: "Space Grotesk", sans-serif;  background-image: url('${rootBgImage}'); background-size: cover; background-repeat: no-repeat`}
  bind:this={node}
>
  <!-- fullscreen button -->
  {#if $openModal.showFullscreenButton}
    {#if $openModal.fullscreen}
      <button
        type="button"
        onclick={() => ($openModal.fullscreen = !$openModal.fullscreen)}
        class="absolute right-4 top-4 rounded-full bg-white p-1.5 transition-all duration-300 hover:scale-90"
      >
        <img src="/free-tools/progress-report/close-icon.svg" alt="" class="" />
      </button>
    {:else}
      <button
        type="button"
        onclick={() => ($openModal.fullscreen = !$openModal.fullscreen)}
        class="absolute right-4 top-4 w-7 transition-all duration-300 hover:scale-90"
      >
        <img src="/free-tools/progress-report/full-screen-icon.svg" alt="" class="" />
      </button>
    {/if}
  {/if}

  <div class="mt-20">
    <!-- using both md & lg for the width here because the lib doesn't consider md to be medium screens and above, using md alone will make the output break on desktop so i had to also specify for large screens -->
    <div
      class="z-20 mx-auto flex h-[16rem] w-[16rem] items-center justify-center rounded-lg border-4 border-gray-100 bg-white shadow-md"
    >
      <div class="relative flex h-full w-full flex-col items-center justify-center gap-3 px-2">
        <!-- avatar -->
        <img
          src={`https://assets.cdn.clsrio.com/progress-report/avatar/${$htmlBody.avatar || 'avatar_a'}.svg`}
          alt=""
          class="absolute top-0 -mt-[2.2rem] ml-2 h-[25%] w-[25%]"
        />

        <!-- mood -->
        {#if $htmlBody.name || $htmlBody.mood.text}
          <div
            style="background-color: {$backgroundColor}; color: white; display: flex;"
            class="mt-6 flex items-center justify-between rounded-2xl border border-[#EDEDED] px-3 py-0.5 text-[10px] font-semibold md:mt-3 md:text-[0.7rem]"
          >
            <span class="mr-0.5">{$htmlBody.name}</span>

            {#if $htmlBody.mood.text}
              <span class="flex items-center gap-1">
                <p class="text-[10px] font-semibold md:text-[0.7rem]">
                  is {$htmlBody.mood.text}
                </p>
                <img
                  src="https://assets.cdn.clsrio.com/progress-report/emojis/{$htmlBody.mood.iconSrc}.png"
                  alt={$htmlBody.mood.text}
                  class="w-3"
                />
              </span>
            {/if}
          </div>
        {:else}
          <p
            style="background-color: {$backgroundColor}"
            class="mt-3 rounded-2xl border border-[#EDEDED] px-3 py-0.5 text-[9px] font-medium text-white"
          >
            Add your name
          </p>
        {/if}

        <!-- learning -->
        <span
          class="h-[10vh] w-full overflow-hidden p-1 text-center text-[0.7rem] font-normal outline-none md:my-2 md:h-[12vh] md:text-[0.8rem]"
        >
          {$htmlBody.learning}
        </span>

        <!-- progress -->
        <div class="mb-2 flex flex-col items-center justify-center md:mb-0">
          <div class="h-4 w-full rounded-full border border-[#d9e0f5] bg-[#f1f6ff] p-0.5">
            <div
              class="progress-range h-full w-full rounded-full"
              style="background: {$backgroundColor}; width: {$htmlBody.progress}%"
            ></div>
          </div>
          <p class="mt-1 text-[12px] font-semibold">Progress Achieved: {$htmlBody.progress}%</p>
        </div>
      </div>
    </div>

    <div
      style="display: flex;"
      class="bottom-5 mx-auto mt-20 flex w-[50%] items-center justify-center gap-1 rounded-md border bg-white px-2 py-1"
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
