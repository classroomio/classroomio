<script lang="ts">
  import { onMount } from 'svelte';
  import { fly } from 'svelte/transition';
  import { sineInOut } from 'svelte/easing';
  import Timer from './components/Timer.svelte';
  import ToolsHeader from '$lib/ToolsHeader/ToolsHeader.svelte';

  let timer: NodeJS.Timeout;
  let buzzSound: HTMLAudioElement;
  let isNextStep: boolean = false;
  let isPaused: boolean = false;
  let soundOn: boolean = true;

  let hours: number = 0;
  let minutes: number = 0;
  let seconds: number = 0;

  let activityName: string = '';
  let displayTime: string = '00:00:00';
  let totalSeconds: number = 0;
  let formattedTime: string = '00:00';

  function toggleTimer() {
    if (isPaused) {
      // Start or resume the timer
      isPaused = false;
      if (totalSeconds <= 0) {
        totalSeconds = hours * 3600 + minutes * 60 + seconds;
      }
      if (totalSeconds <= 0) {
        alert('Please set a valid timer.');
        isPaused = true;
        return;
      }
      timer = setInterval(() => {
        if (totalSeconds <= 0) {
          if (soundOn) {
            buzzSound.play();
          }
          clearInterval(timer);
          isPaused = true;
        } else {
          totalSeconds--;
          updateDisplayTime();
        }
      }, 1000);
    } else {
      // Pause the timer
      clearInterval(timer);
      isPaused = true;
    }
    isNextStep = true;
  }

  function toggleSound() {
    soundOn = !soundOn;
  }

  function updateDisplayTime() {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    displayTime = `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(
      secs
    ).padStart(2, '0')}`;
    formattedTime = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  function restartTimer() {
    clearInterval(timer);
    totalSeconds = hours * 3600 + minutes * 60 + seconds;
    if (totalSeconds <= 0) {
      alert('Please set a valid timer.');
      return;
    }
    isPaused = false;
    timer = setInterval(() => {
      if (totalSeconds <= 0) {
        if (soundOn) {
          buzzSound.play();
        }
        clearInterval(timer);
      } else {
        totalSeconds--;
        updateDisplayTime();
      }
    }, 1000);
    updateDisplayTime();
  }

  function resetTimer() {
    isNextStep = false;
    clearInterval(timer);
    isPaused = false;
    hours = 0;
    minutes = 0;
    seconds = 0;
    totalSeconds = 0;
    activityName = '';
    displayTime = '00:00:00';
    formattedTime = '00:00';
  }

  onMount(() => {
    buzzSound = new Audio('https://assets.cdn.clsrio.com/buzz-sound.wav');
  });
</script>

<svelte:head>
  <title>Activity Timer | ClassroomIO</title>
  <meta property="og:image" itemprop="image" content="" />
  <meta property="og:title" content="Activity Timer" />
  <meta
    property="og:description"
    content="Use this activity timer to set a timer for random activities"
  />

  <meta property="og:image:secure_url" itemprop="image" content="" />

  <meta name="twitter:title" content="Activity Timer" />
  <meta
    name="twitter:description"
    content="Use this activity timer to set a timer for random activities"
  />
  <meta name="twitter:image" content="" />
</svelte:head>

<section class="mt-[30%] px-5 md:px-0 md:mt-[7%]">
  <ToolsHeader>
    <img
      src="/free-tools/name-picker.svg"
      class="w-[15%] md:w-[5%] mx-auto border rounded-full"
      alt=""
    />
    <h1 class="text-4xl md:text-6xl font-bold text-[#040F2D] my-3">Timed Activity Timer</h1>
    <p class="text-[13px] text-[#656565] font-light md:font-normal md:w-[45%] mx-auto">
      Use this online name picker to draw a random name from a list of names, or to draw several
      names randomly out of a list. You can use it as a name randomizer for a class activities.
    </p>
  </ToolsHeader>

  <div class="w-full md:w-2/4 my-10 mx-auto border rounded-md overflow-hidden">
    <!-- countdown setter -->
    {#if !isNextStep}
      <div transition:fly={{ y: -300, delay: 0, easing: sineInOut }} class="px-6 py-8">
        <div>
          <h1 class="font-bold text-sm">Name of activity</h1>
          <input
            type="text"
            bind:value={activityName}
            class="w-full rounded-sm border py-2 mt-3 bg-[#F1F2F4] outline-none px-3 focus-within:border-[#0233BD] focus-within:border"
          />
        </div>

        <div class="mt-10">
          <h1 class="font-bold text-sm">Set an Activity</h1>
          <div class="flex flex-wrap justify-between gap-y-5 w-full mt-3 uppercase font-bold">
            <div class="bg-[#F1F2F4] w-full md:w-[30%] border px-4 py-5">
              <div class="w-2/4 md:w-full mx-auto flex items-end gap-2">
                <input
                  type="number"
                  bind:value={hours}
                  class="w-[80%] md:w-[75%] outline-none text-center py-3 px-1.5 text-3xl placeholder:text-3xl placeholder:text-black"
                />
                <p class="text-[10px]">hrs</p>
              </div>
            </div>

            <div class="bg-[#F1F2F4] w-full md:w-[30%] border px-4 py-5">
              <div class="w-2/4 md:w-full mx-auto flex items-end gap-2">
                <input
                  type="number"
                  bind:value={minutes}
                  class="w-[80%] md:w-[75%] outline-none text-center py-3 px-1.5 text-3xl placeholder:text-3xl placeholder:text-black"
                />
                <p class="text-[10px]">mins</p>
              </div>
            </div>

            <div class="bg-[#F1F2F4] w-full md:w-[30%] border px-4 py-5">
              <div class="w-2/4 md:w-full mx-auto flex items-end gap-2">
                <input
                  type="number"
                  bind:value={seconds}
                  class="w-[80%] md:w-[75%] outline-none text-center py-3 px-1.5 text-3xl placeholder:text-3xl placeholder:text-black"
                />
                <p class="text-[10px]">sec</p>
              </div>
            </div>
          </div>

          <div class="flex justify-end mt-10">
            <button
              type="button"
              on:click={toggleTimer}
              class="bg-[#0F62FE] text-white text-sm px-5 py-3 rounded-md flex gap-3 items-center"
            >
              <img src="/free-tools/timer/loading-timer.svg" alt="" />
              Start Timer</button
            >
          </div>
        </div>
      </div>
    {/if}

    <!-- countdown -->
    {#if isNextStep}
      <Timer
        {activityName}
        {formattedTime}
        {displayTime}
        {resetTimer}
        {toggleTimer}
        {toggleSound}
        {restartTimer}
        {isPaused}
        {soundOn}
      />
    {/if}
  </div>
</section>
