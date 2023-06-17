<script>
  import { onMount } from 'svelte';
  import Box from '../../Box/index.svelte';
  import QuizLoader from './Loader.svelte';
  import QuizCard from './QuizCard.svelte';
  import CoursesEmptyIcon from '../../Icons/CoursesEmptyIcon.svelte';
  import { snackbarStore } from '../../Snackbar/store';
  import { SNACKBAR_SEVERITY } from '../../Snackbar/constants';
  import { supabase } from '../../../utils/functions/supabase';
  import { currentOrg, quizesStore } from '../../../utils/store/org';

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
      $snackbarStore.message = "Something's not right - Please try later";
      $snackbarStore.severity = SNACKBAR_SEVERITY.ERROR;
      $snackbarStore.open = true;
      return;
    }
    console.log('data', data);
    quizesStore.set(data);
    isLoading = false;
  }

  $: fetchQuizes($currentOrg.id);
</script>

<div
  class="flex items-center justify-center lg:justify-start flex-wrap my-4 m-auto"
>
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
        <h3 class="dark:text-white text-2xl my-5">No Quiz Created</h3>
        <p class="dark:text-white w-1/3 text-center">
          Create interactive quizzes with scoreboard for your students.
        </p>
      </Box>
    {/each}
  {/if}
</div>
