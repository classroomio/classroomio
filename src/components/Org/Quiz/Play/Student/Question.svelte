<script>
  import QuizQuestion from '../../QuizQuestion.svelte';
  import PlayContainer from '../Container.svelte';
  import PlayHeader from '../Header/index.svelte';
  import { quizStore } from '../../../../../utils/store/org';

  let totalQ = $quizStore.questions.length;
  let curQId = 0;
  let currentQuestion = $quizStore.questions[0] || {};

  // dynamically called depending on supabase changes
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

  // dynamically called depending on supabase changes
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
</script>

<PlayContainer>
  <div slot="header">
    <PlayHeader startCount={true} showCountDown={true} />
  </div>

  <div slot="body" class="quiz-body">
    {#if currentQuestion}
      <QuizQuestion {currentQuestion} isPreview={false} />
    {:else}
      <h2>No question added</h2>
    {/if}
  </div>
</PlayContainer>

<style>
  .quiz-body {
    width: 500px;
    margin: auto;
  }
</style>
