<script lang="ts">
  import { onMount } from 'svelte';
  import { fly } from 'svelte/transition';
  import ChevronLeftIcon from '@lucide/svelte/icons/chevron-left';
  import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
  import QuizQuestion from '../quiz-question.svelte';
  import PlayContainer from './container.svelte';
  import PlayHeader from './header/index.svelte';
  import { quizStore } from '$lib/utils/store/org';
  import { themeImages } from '$lib/utils/constants/quiz';
  import { Button } from '@cio/ui/base/button';
  import { IconButton } from '@cio/ui/custom/icon-button';

  let { exitPreview = () => {} } = $props();

  let bgImg = $state();
  let totalQ = $quizStore.questions.length;
  let curQId = $state(0);
  let currentQuestion = $state($quizStore.questions[0] || {});

  function handlePrev() {
    const prevQId = curQId - 1;
    console.log('prevQId', prevQId);
    const prev = $quizStore.questions[prevQId];
    console.log('prev', prev);
    if (prev) {
      currentQuestion = prev;
      curQId = prevQId;
    }
  }

  function handleNext() {
    const nextQId = curQId + 1;
    console.log('nextqid', nextQId);
    const next = $quizStore.questions[nextQId];
    console.log('next', next);
    if (next) {
      currentQuestion = next;
      curQId = nextQId;
    }
  }

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
      <PlayContainer>
        {#snippet header()}
          <div>
            <PlayHeader startCount={true} showCountDown={true} />
          </div>
        {/snippet}

        {#snippet body()}
          <div class="quiz-body">
            {#if currentQuestion}
              <QuizQuestion {currentQuestion} isPreview={true} />
            {:else}
              <h2>No question added</h2>
            {/if}
          </div>
        {/snippet}

        {#snippet footer()}
          <div class="flex flex-col justify-center">
            {#if currentQuestion}
              <Button variant="ghost" onclick={exitPreview} class="w-fit">Exit Preview</Button>

              <div class="flex items-center justify-center">
                <IconButton onclick={handlePrev}>
                  <ChevronLeftIcon size={16} />
                </IconButton>
                <p class="mx-3">{curQId + 1} / {totalQ}</p>
                <IconButton onclick={handleNext}>
                  <ChevronRightIcon size={16} />
                </IconButton>
              </div>
            {/if}
          </div>
        {/snippet}
      </PlayContainer>
    </div>
  </div>
{/if}

<style>
  .quiz-body {
    width: 500px;
    margin: auto;
  }
</style>
