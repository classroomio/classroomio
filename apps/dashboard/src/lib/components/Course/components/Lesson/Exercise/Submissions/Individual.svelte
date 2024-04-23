<script lang="ts">
  import { Loading } from 'carbon-components-svelte';
  import type { ExerciseSubmissions } from '$lib/utils/types';
  import { questionnaire } from '../../store/exercise';
  import { submissions } from './store';
  import { t } from '$lib/utils/functions/translations';

  export let isLoading = false;

  const defaultImg =
    'https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&q=60&w=800&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8YXZhdGFyc3xlbnwwfHwwfHx8Mg%3D%3D';

  let studentSelected = 0;

  const isSelected = (
    student: ExerciseSubmissions,
    option: { question_id: number; value: string[] }
  ) => {
    if ($submissions) {
      let submittedAnswer = student?.answers;
      let filteredAnswer = submittedAnswer.filter(
        (ans: { question_id: number }) => ans.question_id === option.question_id
      );
      if (filteredAnswer.map((ans) => ans.answers.length > 1)) {
        return filteredAnswer.some((ans) => ans.answers.includes(option.value));
      } else {
        return filteredAnswer.map((ans: { answers: any }) => ans.answers) == option.value;
      }
    }
  };

  const isCorrect = (
    student: ExerciseSubmissions,
    option: { is_correct?: any; question_id?: number; value?: string[] }
  ) => {
    if (!isSelected(student, option)) return;
    if (option.is_correct) {
      return 'border-green-700';
    } else {
      return 'border-red-700';
    }
  };
  const getOpenAnswer = (student: ExerciseSubmissions, q: never) => {
    let submittedAnswer = student?.answers;
    let filteredAnswer = submittedAnswer.filter(
      (ans: { question_id: number }) => ans.question_id === q.id
    );
    if (filteredAnswer.some((ans: { open_answer: string }) => ans.open_answer == '')) {
      return $t('course.navItem.lessons.exercises.all_exercises.analytics.individual.no');
    } else {
      return filteredAnswer.map((ans: { open_answer: any }) => ans.open_answer);
    }
  };
</script>

{#if isLoading}
  <Loading withOverlay={true} />
{:else if $submissions?.length}
  <div class="flex gap-1 w-full overflow-auto mt-2 mb-5">
    {#each $submissions as student, i}
      <button on:click={() => (studentSelected = i)} class="flex flex-col items-center w-20">
        <div
          class={`flex items-center justify-center w-12 h-12 rounded-full ${
            studentSelected == i ? 'border-[3px] border-primary-700' : ''
          }`}
        >
          <img
            src={student.submitted_by.profile.avatar_url
              ? student.submitted_by.profile.avatar_url
              : defaultImg}
            alt="student"
            class={`w-10 h-10 rounded-full bg-white m-1`}
          />
        </div>
        <p class="line-clamp-2 w-20 whitespace-pre-wrap leading-4">
          {student.submitted_by.profile.fullname}
        </p>
      </button>
    {/each}
  </div>

  <p class="font-medium mb-2">
    {$submissions[studentSelected].submitted_by.profile.fullname}'s {$t(
      'course.navItem.lessons.exercises.all_exercises.analytics.individual.answers'
    )}
  </p>
  {#if $submissions[studentSelected]}
    {#if $questionnaire.questions}
      {#each $questionnaire.questions as q, i}
        <div class="pb-4">
          <h3 class="text-lg">{i + 1}. {q.title}</h3>
          {#if q.question_type_id !== 3}
            {#each q.options as option, i}
              <div
                class={`flex gap-2 items-center my-2 border-2 border-gray-300 rounded-md p-2 ${isCorrect(
                  $submissions[studentSelected],
                  option
                )}`}
              >
                <input
                  type="radio"
                  name=""
                  id=""
                  class="form-radio"
                  checked={isSelected($submissions[studentSelected], option)}
                />
                <span class="dark:text-white">{option.label}</span>
              </div>
            {/each}
          {:else}
            <div class="rounded bg-slate-100 dark:bg-slate-300 p-2 my-1 w-full">
              <span class="text-base font-medium text-black">
                {getOpenAnswer($submissions[studentSelected], q)}
              </span>
            </div>
          {/if}
        </div>
      {/each}
    {/if}
  {/if}
{/if}
