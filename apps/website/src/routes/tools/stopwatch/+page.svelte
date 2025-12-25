<script lang="ts">
  import { preventDefault } from 'svelte/legacy';

  import { onMount } from 'svelte';
  import { fly } from 'svelte/transition';
  import { sineInOut } from 'svelte/easing';
  import Timer from '$lib/features/tools/stopwatch/timer.svelte';
  import { ToolsHeader } from '$lib/components';

  let timer: NodeJS.Timeout;
  let buzzSound: HTMLAudioElement;
  let isNextStep: boolean = $state(false);
  let isPaused: boolean = $state(false);
  let soundOn: boolean = $state(true);

  let hours: number = $state(0);
  let minutes: number = $state(0);
  let seconds: number = $state(0);

  let activityName: string = $state('');
  let displayTime: string = $state('00:00:00');
  let totalSeconds: number = 0;
  let formattedTime: string = $state('00:00');

  export function toggleTimer() {
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

  export function startTimer() {
    toggleTimer();
    totalSeconds = hours * 3600 + minutes * 60 + seconds;
    updateDisplayTime();
  }

  function toggleSound() {
    soundOn = !soundOn;
  }

  function updateDisplayTime() {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    displayTime = `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

    if (formattedTime === '00:00') {
      formattedTime = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
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
    buzzSound = new Audio('https://assets.cdn.clsrio.com/beeping-sound.mp3');
  });
</script>

<svelte:head>
  <title>Activity Stopwatch | ClassroomIO</title>
  <meta property="og:image" itemprop="image" content="https://brand.cdn.clsrio.com/og/free-tools.png" />
  <meta property="og:title" content="Activity Stopwatch | ClassroomIO" />
  <meta
    property="og:description"
    content="Stay on track with a customizable stopwatch for timed tasks, quizzes, and study sessions"
  />

  <meta property="og:image:secure_url" itemprop="image" content="https://brand.cdn.clsrio.com/og/free-tools.png" />

  <meta name="twitter:title" content="Activity Stopwatch | ClassroomIO" />
  <meta
    name="twitter:description"
    content="Stay on track with a customizable stopwatch for timed tasks, quizzes, and study sessions"
  />
  <meta name="twitter:image" content="https://brand.cdn.clsrio.com/og/free-tools.png" />
</svelte:head>

<section class=" bg-white px-5 md:px-0">
  <ToolsHeader>
    <img src="/free-tools/name-picker.svg" class="mx-auto w-[15%] rounded-full border md:w-[5%]" alt="" />
    <h1 class="my-3 text-4xl font-bold text-[#040F2D] md:text-6xl">Activity Stopwatch</h1>
    <p class="text-md mx-auto font-light text-[#656565] md:w-[45%] md:font-normal">
      Stay on track and enhance productivity with our customizable stopwatch for timed tasks, quizzes, and study
      sessions.
    </p>
  </ToolsHeader>

  <div class="mx-auto my-10 w-full overflow-hidden rounded-md border bg-white md:w-2/4">
    <!-- countdown setter -->
    {#if !isNextStep}
      <div transition:fly={{ y: -300, delay: 0, easing: sineInOut }} class="bg-white px-6 py-8">
        <form onsubmit={preventDefault(startTimer)}>
          <div>
            <h1 class="text-sm font-bold">Name of activity</h1>
            <input
              type="text"
              bind:value={activityName}
              class="mt-3 w-full rounded-sm border bg-[#F1F2F4] px-3 py-2 outline-none focus-within:border focus-within:border-[#0233BD]"
              required
            />
          </div>

          <div class="mt-10 bg-white">
            <h1 class="text-sm font-bold">Set an Activity</h1>
            <div class="mt-3 flex w-full flex-wrap justify-between gap-y-5 font-bold uppercase">
              <div class="w-full border bg-[#F1F2F4] px-4 py-5 md:w-[30%]">
                <div class="mx-auto flex w-2/4 items-end gap-2 md:w-full">
                  <input
                    type="number"
                    bind:value={hours}
                    class="w-[80%] px-1.5 py-3 text-center text-3xl outline-none placeholder:text-3xl placeholder:text-black md:w-[75%]"
                  />
                  <p class="text-[10px]">hrs</p>
                </div>
              </div>

              <div class="w-full border bg-[#F1F2F4] px-4 py-5 md:w-[30%]">
                <div class="mx-auto flex w-2/4 items-end gap-2 md:w-full">
                  <input
                    type="number"
                    bind:value={minutes}
                    class="w-[80%] px-1.5 py-3 text-center text-3xl outline-none placeholder:text-3xl placeholder:text-black md:w-[75%]"
                  />
                  <p class="text-[10px]">mins</p>
                </div>
              </div>

              <div class="w-full border bg-[#F1F2F4] px-4 py-5 md:w-[30%]">
                <div class="mx-auto flex w-2/4 items-end gap-2 md:w-full">
                  <input
                    type="number"
                    bind:value={seconds}
                    class="w-[80%] px-1.5 py-3 text-center text-3xl outline-none placeholder:text-3xl placeholder:text-black md:w-[75%]"
                  />
                  <p class="text-[10px]">sec</p>
                </div>
              </div>
            </div>

            <div class="mt-10 flex justify-end">
              <button
                type="submit"
                class="flex items-center gap-3 rounded-md bg-[#0F62FE] px-5 py-3 text-sm text-white"
              >
                <img src="/free-tools/stopwatch/loading-timer.svg" alt="" />
                Start Timer</button
              >
            </div>
          </div>
        </form>
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
