<script lang="ts">
  import { Spinner } from '@cio/ui/base/spinner';

  import { submissions } from './store';
  import { questionnaire } from '../../store/exercise';
  import { t } from '$lib/utils/functions/translations';
  import type { ExerciseSubmissions } from '$features/course/utils/types';
  import type { Question } from '$features/course/types';

  interface Props {
    isLoading?: boolean;
  }

  let { isLoading = $bindable(false) }: Props = $props();

  const defaultImg =
    'https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&q=60&w=800&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8YXZhdGFyc3xlbnwwfHwwfHx8Mg%3D%3D';

  let studentSelected = $state(0);

  const isSelected = (student: ExerciseSubmissions, questionId: number, optionValue: string | null) => {
    if (!$submissions || !student?.answers) return false;
    const submittedAnswer = student.answers;
    const filteredAnswer = submittedAnswer.filter((ans) => ans.question_id === questionId);
    if (filteredAnswer.length === 0) return false;

    // Check if the option value is in the answers array
    return filteredAnswer.some((ans) => {
      if (Array.isArray(ans.answers)) {
        return ans.answers.includes(optionValue || '');
      }
      return ans.answers === optionValue;
    });
  };

  const isCorrect = (student: ExerciseSubmissions, questionId: number, option: Question['options'][number]) => {
    if (!isSelected(student, questionId, option.value || null)) return '';
    if (option.isCorrect) {
      return 'border-green-700';
    } else {
      return 'border-red-700';
    }
  };

  const getOpenAnswer = (student: ExerciseSubmissions, questionId: number) => {
    if (!student?.answers) return '';
    const submittedAnswer = student.answers;
    const filteredAnswer = submittedAnswer.filter((ans) => ans.question_id === questionId);
    if (filteredAnswer.length === 0)
      return $t('course.navItem.lessons.exercises.all_exercises.analytics.individual.no');
    if (filteredAnswer.some((ans) => ans.open_answer === '')) {
      return $t('course.navItem.lessons.exercises.all_exercises.analytics.individual.no');
    }
    return filteredAnswer.map((ans) => ans.open_answer).join(', ') || '';
  };
</script>

{#if isLoading}
  <Spinner />
{:else if $submissions?.length}
  <div class="mt-2 mb-5 flex w-full gap-1 overflow-auto">
    {#each $submissions as student, i}
      <button onclick={() => (studentSelected = i)} class="flex w-20 flex-col items-center">
        <div
          class={`flex h-12 w-12 items-center justify-center rounded-full ${
            studentSelected == i ? 'border-primary-700 border-[3px]' : ''
          }`}
        >
          <img
            src={student.submitted_by.profile.avatar_url ? student.submitted_by.profile.avatar_url : defaultImg}
            alt="student"
            class="m-1 max-h-10 w-10 rounded-full bg-white"
          />
        </div>
        <p class="line-clamp-2 w-20 leading-4 whitespace-pre-wrap">
          {student.submitted_by.profile.fullname}
        </p>
      </button>
    {/each}
  </div>

  <p class="mb-2 font-medium">
    {$submissions[studentSelected].submitted_by.profile.fullname}'s {$t(
      'course.navItem.lessons.exercises.all_exercises.analytics.individual.answers'
    )}
  </p>
  {#if $submissions[studentSelected]}
    {#if $questionnaire.questions}
      {#each $questionnaire.questions as q, i}
        <div class="pb-4">
          <h3 class="text-lg">{i + 1}. {q.title}</h3>
          {#if q.questionTypeId !== 3}
            {#each q.options as option}
              {@const questionId = typeof q.id === 'string' ? parseInt(q.id, 10) : q.id}
              <div
                class={`my-2 flex items-center gap-2 rounded-md border-2 border-gray-300 p-2 ${isCorrect(
                  $submissions[studentSelected],
                  questionId,
                  option
                )}`}
              >
                <input
                  type="radio"
                  name=""
                  id=""
                  class="form-radio"
                  checked={isSelected($submissions[studentSelected], questionId, option.value)}
                />
                <span class="dark:text-white">{option.label}</span>
              </div>
            {/each}
          {:else}
            {@const questionId = typeof q.id === 'string' ? parseInt(q.id, 10) : q.id}
            <div class="my-1 w-full rounded bg-slate-100 p-2 dark:bg-slate-300">
              <span class="text-base font-medium text-black">
                {getOpenAnswer($submissions[studentSelected], questionId)}
              </span>
            </div>
          {/if}
        </div>
      {/each}
    {/if}
  {/if}
{/if}
