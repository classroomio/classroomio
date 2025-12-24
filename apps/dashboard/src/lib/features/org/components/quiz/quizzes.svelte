<script>
  import QuizLoader from './loader.svelte';
  import QuizCard from './quiz-card.svelte';
  import { Empty } from '@cio/ui/custom/empty';
  import HelpCircleIcon from '@lucide/svelte/icons/help-circle';
  import { snackbar } from '$features/ui/snackbar/store';
  import { supabase } from '$lib/utils/functions/supabase';
  import { currentOrg, quizesStore } from '$lib/utils/store/org';
  import { t } from '$lib/utils/functions/translations';

  let isLoading = $state(false);

  async function fetchQuizes(id) {
    if (!id) return;
    isLoading = true;

    const { data, error } = await supabase
      .from('quiz')
      .select(`*`)
      .eq('organization_id', id)
      .order('updated_at', { ascending: false });

    if (error) {
      snackbar.error();
      return;
    }
    console.log('data', data);
    quizesStore.set(data);
    isLoading = false;
  }

  $effect(() => {
    fetchQuizes($currentOrg.id);
  });
</script>

<div class="m-auto my-4 flex flex-wrap items-center justify-center lg:justify-start">
  {#if isLoading}
    <QuizLoader />
    <QuizLoader />
    <QuizLoader />
  {:else}
    {#each $quizesStore as quiz}
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
