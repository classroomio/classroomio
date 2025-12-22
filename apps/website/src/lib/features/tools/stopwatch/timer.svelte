<script lang="ts">
  import { sineInOut } from 'svelte/easing';
  import { fly } from 'svelte/transition';

  export let activityName: string;
  export let formattedTime: string;
  export let displayTime: string;
  export let resetTimer: () => void;
  export let toggleSound: () => void;
  export let toggleTimer: () => void;
  export let restartTimer: () => void;
  export let isPaused: boolean;
  export let soundOn: boolean;
</script>

<div transition:fly={{ y: 100, delay: 0, easing: sineInOut }}>
  <div class="px-6 pt-8 text-center">
    <button
      type="button"
      on:click={resetTimer}
      class="text-[10px] text-[#656565] font-semibold uppercase underline"
      >set timer for another activity</button
    >

    <button
      class="border mx-auto mt-7 mb-3 px-2 py-0.5 rounded-full flex items-center gap-1 text-sm text-[#656565] font-semibold border-[#C2D2FF] bg-[#DCE5FF]"
    >
      {activityName}:
      <span class="text-[#0233BD]">{formattedTime}</span>
    </button>

    <!-- countdown -->
    <h1 class="text-[#040F2D] mb-14 text-6xl font-bold">{displayTime}</h1>
  </div>

  <div class="flex">
    <button
      type="button"
      on:click={toggleSound}
      class="bg-[#F7F7F7] w-[34%] flex flex-col gap-1 items-center uppercase text-[10px] py-5 md:py-10 rounded-bl-md hover:bg-[#F1F6FF] transition-all duration-500"
    >
      {#if soundOn}
        <img src="/free-tools/stopwatch/speaker-icon.svg" alt="" class="w-7 md:w-12" />
      {:else}
        <img src="/free-tools/stopwatch/no-speaker-icon.svg" alt="" class="w-7 md:w-12" />
      {/if}
      buzzer</button
    >
    <button
      type="button"
      on:click={toggleTimer}
      class="bg-[#0F62FE] text-white w-[34%] flex flex-col gap-1 items-center uppercase text-[10px] py-5 md:py-10"
    >
      {#if isPaused}
        <img src="/free-tools/stopwatch/play-icon.svg" alt="" class="w-7 md:w-12" />
      {:else}
        <img src="/free-tools/stopwatch/pause-icon.svg" alt="" class="w-7 md:w-12" />
      {/if}
      {isPaused ? 'play' : 'pause'}</button
    >
    <button
      type="button"
      on:click={restartTimer}
      class="bg-[#F7F7F7] w-[34%] flex flex-col gap-1 items-center uppercase text-[10px] py-5 md:py-10 rounded-br-md hover:bg-[#F1F6FF] transition-all duration-500"
    >
      <img src="/free-tools/stopwatch/reset-icon.svg" alt="" class="w-7 md:w-12" />
      restart</button
    >
  </div>
</div>
