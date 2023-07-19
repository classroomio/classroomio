<script>
  import { onMount } from 'svelte';
  import { fly } from 'svelte/transition';
  import { SyncLoader } from 'svelte-loading-spinners';
  import {
    themeImages,
    STUDENTS_PLAY_STEPS,
  } from '../../../../../utils/constants/quiz';
  import { quizStore, playQuizStore } from '../../../../../utils/store/org';
  import Setup from './Setup.svelte';
  import Question from './Question.svelte';

  let bgImg;

  onMount(() => {
    bgImg = themeImages[$quizStore.theme].play;
  });
</script>

{#if bgImg}
  <div
    class="absolute inset-0 z-50 bg-white h-screen w-screen"
    in:fly={{ y: 500, duration: 500 }}
    out:fly={{ y: 500, duration: 500 }}
  >
    <div
      class="p-5 h-full w-full"
      style="background: url({bgImg}) no-repeat center center fixed; -webkit-background-size: cover;-moz-background-size: cover;-o-background-size: cover;background-size: cover;min-height: 100vh;height: fit-content;"
    >
      {#if $playQuizStore.studentStep === STUDENTS_PLAY_STEPS.PIN_SETUP}
        <Setup />
      {:else if $playQuizStore.studentStep === STUDENTS_PLAY_STEPS.QUESTION}
        <Question />
      {:else}
        <div class="w-full m-auto">
          <SyncLoader size="20" color="#1d4ed8" unit="px" duration="1s" />
        </div>
      {/if}
    </div>
  </div>
{/if}
