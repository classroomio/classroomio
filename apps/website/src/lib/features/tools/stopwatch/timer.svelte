<script lang="ts">
  import { sineInOut } from 'svelte/easing';
  import { fly } from 'svelte/transition';

  interface Props {
    activityName: string;
    formattedTime: string;
    displayTime: string;
    resetTimer: () => void;
    toggleSound: () => void;
    toggleTimer: () => void;
    restartTimer: () => void;
    isPaused: boolean;
    soundOn: boolean;
  }

  let {
    activityName,
    formattedTime,
    displayTime,
    resetTimer,
    toggleSound,
    toggleTimer,
    restartTimer,
    isPaused,
    soundOn
  }: Props = $props();
</script>

<div transition:fly={{ y: 100, delay: 0, easing: sineInOut }}>
  <div class="px-6 pt-8 text-center">
    <button type="button" onclick={resetTimer} class="text-[10px] font-semibold uppercase text-[#656565] underline"
      >set timer for another activity</button
    >

    <button
      class="mx-auto mb-3 mt-7 flex items-center gap-1 rounded-full border border-[#C2D2FF] bg-[#DCE5FF] px-2 py-0.5 text-sm font-semibold text-[#656565]"
    >
      {activityName}:
      <span class="text-[#0233BD]">{formattedTime}</span>
    </button>

    <!-- countdown -->
    <h1 class="mb-14 text-6xl font-bold text-[#040F2D]">{displayTime}</h1>
  </div>

  <div class="flex">
    <button
      type="button"
      onclick={toggleSound}
      class="flex w-[34%] flex-col items-center gap-1 rounded-bl-md bg-[#F7F7F7] py-5 text-[10px] uppercase transition-all duration-500 hover:bg-[#F1F6FF] md:py-10"
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
      onclick={toggleTimer}
      class="flex w-[34%] flex-col items-center gap-1 bg-[#0F62FE] py-5 text-[10px] uppercase text-white md:py-10"
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
      onclick={restartTimer}
      class="flex w-[34%] flex-col items-center gap-1 rounded-br-md bg-[#F7F7F7] py-5 text-[10px] uppercase transition-all duration-500 hover:bg-[#F1F6FF] md:py-10"
    >
      <img src="/free-tools/stopwatch/reset-icon.svg" alt="" class="w-7 md:w-12" />
      restart</button
    >
  </div>
</div>
