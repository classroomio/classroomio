<script>
  import Box from '$lib/components/Box/index.svelte';
  import QuizLoader from './Loader.svelte';
  import QuizCard from './QuizCard.svelte';
  import CoursesEmptyIcon from '$lib/components/Icons/CoursesEmptyIcon.svelte';
  import { snackbar } from '$lib/components/Snackbar/store';
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
      <Box>
        <CoursesEmptyIcon />
        <h3 class="dark:text-white text-2xl my-5">{$t('components.quiz.no_quizz')}</h3>
        <p class="dark:text-white w-1/3 text-center">
          {$t('components.quiz.interactive')}
        </p>
      </Box>
    {/each}
  {/if}
</div>
