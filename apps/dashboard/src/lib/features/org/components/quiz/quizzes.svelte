<script>
  import QuizLoader from './loader.svelte';
  import QuizCard from './quiz-card.svelte';
  import { Empty } from '@cio/ui/custom/empty';
  import HelpCircleIcon from '@lucide/svelte/icons/help-circle';
  import { quizApi } from '$features/org/api/quiz.svelte';
  import { currentOrg } from '$lib/utils/store/org';
  import { t } from '$lib/utils/functions/translations';

  $effect(() => {
    if ($currentOrg.id) {
      quizApi.list($currentOrg.id);
    }
  });
</script>

<div class="m-auto my-4 flex flex-wrap items-center justify-center lg:justify-start">
  {#if quizApi.isLoading}
    <QuizLoader />
    <QuizLoader />
    <QuizLoader />
  {:else}
    {#each quizApi.quizzes as quiz}
      <QuizCard {quiz} totalQuestions={quiz.questions?.length || 0} />
    {:else}
      <Empty
        title={$t('components.quiz.no_quizz')}
        description={$t('components.quiz.interactive')}
        icon={HelpCircleIcon}
        variant="page"
      />
    {/each}
  {/if}
</div>
