<script>
  import { onMount } from 'svelte';
  import Box from '$lib/components/Box/index.svelte';
  import QuizLoader from './Loader.svelte';
  import QuizCard from './QuizCard.svelte';
  import CoursesEmptyIcon from '$lib/components/Icons/CoursesEmptyIcon.svelte';
  import { snackbar } from '$lib/components/Snackbar/store';
  import { supabase } from '$lib/utils/functions/supabase';
  import { currentOrg, quizesStore } from '$lib/utils/store/org';
  import { t } from '$lib/utils/functions/translations';

  let isLoading = false;

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

  $: fetchQuizes($currentOrg.id);
</script>

<div class="flex items-center justify-center lg:justify-start flex-wrap my-4 m-auto">
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
