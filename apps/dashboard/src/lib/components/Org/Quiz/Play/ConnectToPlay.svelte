<script>
  import { onMount } from 'svelte';
  import { Spinner } from '@cio/ui/base/spinner';
  import PlayContainer from './Container.svelte';
  import PlayHeader from './Header/index.svelte';
  import { quizStore, playQuizStore } from '$lib/utils/store/org';
  import { STEPS } from '$lib/utils/constants/quiz';
  import { genQuizPin } from '$lib/utils/functions/org';
  import { Button } from '@cio/ui/base/button';

  let isGettingPin = $state(true);

  function getPin() {
    setTimeout(() => {
      $quizStore.pin = genQuizPin();
      isGettingPin = false;
    }, 3000);
  }

  function goToPlayersStep() {
    $playQuizStore.step = STEPS.WAIT_FOR_PLAYERS;
  }

  onMount(() => {
    getPin();
  });
</script>

<PlayContainer>
  {#snippet header()}
    <div>
      <PlayHeader startCount={true} showCountDown={true} />
    </div>
  {/snippet}

  {#snippet body()}
    <div class="w-full rounded-md bg-white px-5 py-7 dark:bg-neutral-800">
      <div class="mb-3">
        <p>1. Visit</p>
        <h3>play.classroomio.com</h3>
      </div>
      <div class="">
        <p>2. Enter Pin</p>
        {#if isGettingPin}
          <Spinner class="size-10! text-blue-700!" />
        {:else}
          <h3>{$quizStore.pin}</h3>
        {/if}
      </div>
    </div>
  {/snippet}

  {#snippet footer()}
    <div class="flex items-center justify-center">
      <p class="mr-3">Let's go</p>
      <Button variant="outline" onclick={goToPlayersStep}>View Players</Button>
    </div>
  {/snippet}
</PlayContainer>
