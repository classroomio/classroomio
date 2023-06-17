<script>
  import { fly } from 'svelte/transition';
  import ChevronLeft16 from 'carbon-icons-svelte/lib/ChevronLeft16';
  import ChevronRight16 from 'carbon-icons-svelte/lib/ChevronRight16';
  import { onMount } from 'svelte';
  import QuizQuestion from '../QuizQuestion.svelte';
  import PlayContainer from './Container.svelte';
  import PlayHeader from './Header/index.svelte';
  import { quizStore } from '../../../../utils/store/org';
  import { themeImages } from '../../../../utils/constants/quiz';
  import PrimaryButton from '../../../PrimaryButton/index.svelte';
  import { VARIANTS } from '../../../PrimaryButton/constants';
  import IconButton from '../../../IconButton/index.svelte';

  export let exitPreview = () => {};

  let bgImg;
  let totalQ = $quizStore.questions.length;
  let curQId = 0;
  let currentQuestion = $quizStore.questions[0] || {};

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
    class="absolute inset-0 z-50 bg-white h-screen w-screen"
    in:fly={{ y: 500, duration: 500 }}
    out:fly={{ y: 500, duration: 500 }}
  >
    <div
      class="p-5 h-full w-full"
      style="background: url({bgImg}) no-repeat center center fixed; -webkit-background-size: cover;-moz-background-size: cover;-o-background-size: cover;background-size: cover;min-height: 100vh;height: fit-content;"
    >
      <PlayContainer>
        <div slot="header">
          <PlayHeader startCount={true} showCountDown={true} />
        </div>

        <div slot="body" class="quiz-body">
          {#if currentQuestion}
            <QuizQuestion {currentQuestion} isPreview={true} />
          {:else}
            <h2>No question added</h2>
          {/if}
        </div>

        <div slot="footer" class="flex justify-center flex-col">
          {#if currentQuestion}
            <PrimaryButton
              label="Exit Preview"
              variant={VARIANTS.TEXT}
              onClick={exitPreview}
              className="w-fit"
            />

            <div class="flex justify-center items-center">
              <IconButton onClick={handlePrev} size="small">
                <ChevronLeft16 class="carbon-icon" />
              </IconButton>
              <p class="mx-3">{curQId + 1} / {totalQ}</p>
              <IconButton onClick={handleNext} size="small">
                <ChevronRight16 class="carbon-icon" />
              </IconButton>
            </div>
          {/if}
        </div>
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
