<script lang="ts">
  import { OpenFullscreen, htmlBody, toggleFullscreenModal, nodeStore } from './store';

  let node: any;

  $: nodeStore.set(node);
</script>

<div class="h-[50vh] w-full border relative" bind:this={node}>
  {#if $OpenFullscreen.open}
    <button
      type="button"
      on:click={toggleFullscreenModal}
      class="absolute top-4 right-4 p-1.5 rounded-full hover:scale-90 transition-all duration-300 bg-white"
    >
      <img src="/free-tools/progress-report/close-icon.svg" alt="" class="" />
    </button>
  {:else}
    <button
      type="button"
      on:click={toggleFullscreenModal}
      class="absolute top-4 right-4 w-7 hover:scale-90 transition-all duration-300"
    >
      <img src="/free-tools/progress-report/full-screen-icon.svg" alt="" class="" />
    </button>
  {/if}

  {#if $htmlBody.background}
    <img
      src="/free-tools/progress-report/backgrounds/{$htmlBody.background}.webp"
      alt=""
      class="absoute z-10 h-full w-full object-cover"
    />
  {:else}
    <img
      src="/free-tools/progress-report/background-icon.svg"
      alt=""
      class="absoute z-10 h-full w-full object-cover"
    />
  {/if}

  <div class="absolute top-[18%] left-[20%] rounded-lg shadow-md bg-white z-20 w-[61%] h-[33vh]">
    <div class="relative w-full h-full flex flex-col justify-center items-center px-2">
      {#if $htmlBody.avatar}
        <img
          src="/free-tools/progress-report/avatars/{$htmlBody.avatar}.svg"
          alt=""
          class="absolute top-0 w-[33%] ml-2 -mt-[2.5rem]"
        />
      {:else}
        <img
          src="/free-tools/progress-report/avatars/avatar_l.svg"
          alt=""
          class="absolute top-0 w-[33%] ml-2 -mt-[2.5rem]"
        />
      {/if}

      {#if $htmlBody.name}
        <div
          class="px-3 py-0.5 border border-[#EDEDED] bg-[#F1F6FF] rounded-2xl -mt-1 font-medium text-[9px] flex items-center justify-between"
        >
          <span class="mr-0.5">{$htmlBody.name}</span>

          {#if $htmlBody.mood.text != ''}
            <span class="flex gap-1 items-center">
              <p class="font-semibold text-[9px]">is {$htmlBody.mood.text}</p>
              <img
                src="/free-tools/progress-report/emojis/{$htmlBody.mood.iconSrc}.png"
                alt={$htmlBody.mood.text}
                class="w-3"
              />
            </span>
          {/if}
        </div>
      {:else}
        <p
          class="px-3 py-0.5 border border-[#EDEDED] bg-[#F1F6FF] rounded-2xl mt-3 font-medium text-[9px]"
        >
          Add your name
        </p>
      {/if}

      {#if $htmlBody.mood.text === ''}
        <p class="text-[10px] my-2">Add your mood</p>
      {/if}

      <span
        role="textbox"
        tabindex={0}
        contenteditable
        bind:textContent={$htmlBody.learning}
        class="w-full mt-2 p-1 overflow-hidden text-[10px] text-center block outline-none h-[10vh]"
      ></span>

      <div class="flex flex-col justify-center items-center">
        <input
          type="range"
          disabled={true}
          min="0"
          max="100"
          bind:value={$htmlBody.progress}
          class=" progress-range"
          style="background: linear-gradient(to right, #0F62FE {$htmlBody.progress}%, #ccc {$htmlBody.progress}%);"
        />
        <p class="text-[10px] font-semibold mt-1">Progress Achieved: {$htmlBody.progress}%</p>
      </div>
    </div>
  </div>
</div>

<style>
  .progress-range {
    -webkit-appearance: none;
    appearance: none;
    width: 80%;
    cursor: pointer;
    outline: none;
    border-radius: 15px;
    height: 0.6rem;
    margin-top: 10px;
  }

  .progress-range::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
  }

  .progress-range::-moz-range-thumb {
    height: 1rem;
    width: 1rem;
    background-color: yellow;
    border-radius: 50%;
    transition: 0.2s ease-in-out;
  }
</style>
