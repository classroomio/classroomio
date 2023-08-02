<script>
  import { onMount } from 'svelte';
  import { fly } from 'svelte/transition';
  import { SyncLoader } from 'svelte-loading-spinners';
  import { themeImages, STEPS } from '$lib/utils/constants/quiz';
  import { quizStore, playQuizStore } from '$lib/utils/store/org';
  import ConnectToPlay from './ConnectToPlay.svelte';
  import Players from './Players.svelte';
  import Question from './Question.svelte';
  import Scoreboard from './Scoreboard.svelte';
  import Podium from './Podium.svelte';

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
      {#if $playQuizStore.step === STEPS.CONNECT_TO_PLAY}
        <ConnectToPlay />
      {:else if $playQuizStore.step === STEPS.WAIT_FOR_PLAYERS}
        <Players />
      {:else if $playQuizStore.step === STEPS.SHOW_NEXT_QUESTION}
        <Question />
      {:else if $playQuizStore.step === STEPS.SCOREBOARD}
        <Scoreboard />
      {:else if $playQuizStore.step === STEPS.PODIUM}
        <Podium />
      {:else}
        <div class="w-full m-auto">
          <SyncLoader size="20" color="#1d4ed8" unit="px" duration="1s" />
        </div>
      {/if}
    </div>
  </div>
{/if}
