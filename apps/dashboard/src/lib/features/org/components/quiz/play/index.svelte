<script>
  import { onMount } from 'svelte';
  import { fly } from 'svelte/transition';
  import { Spinner } from '@cio/ui/base/spinner';
  import { themeImages, STEPS } from '$lib/utils/constants/quiz';
  import { quizStore, playQuizStore } from '$lib/utils/store/org';
  import ConnectToPlay from './connect-to-play.svelte';
  import Players from './players.svelte';
  import Question from './question.svelte';
  import Scoreboard from './scoreboard.svelte';
  import Podium from './podium.svelte';

  let bgImg = $state();

  onMount(() => {
    bgImg = themeImages[$quizStore.theme].play;
  });
</script>

{#if bgImg}
  <div
    class="absolute inset-0 z-50 h-screen w-screen bg-white"
    in:fly={{ y: 500, duration: 500 }}
    out:fly={{ y: 500, duration: 500 }}
  >
    <div
      class="h-full w-full p-5"
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
        <div class="m-auto w-full">
          <Spinner class="size-8! text-blue-700!" />
        </div>
      {/if}
    </div>
  </div>
{/if}
