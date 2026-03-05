<script lang="ts">
  import { Spinner } from '@cio/ui/base/spinner';
  import { ExerciseQuestion } from '@cio/ui';

  import { submissions } from './store';
  import { questionnaire } from '../store';
  import { t } from '$lib/utils/functions/translations';
  import type { ExerciseSubmissions } from './types';
  import type { Question } from '$features/course/types';
  import type { AnswerData } from '@cio/question-types';
  import { toExerciseQuestionModel } from '../question-type-utils';
  import { getExerciseQuestionLabels } from '../question-labels';

  interface Props {
    isLoading?: boolean;
  }

  let { isLoading = $bindable(false) }: Props = $props();

  const defaultImg =
    'https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&q=60&w=800&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8YXZhdGFyc3xlbnwwfHwwfHx8Mg%3D%3D';

  let studentSelected = $state(0);
  const questionLabels = $derived(getExerciseQuestionLabels());

  function toNumericQuestionId(question: Question): number | null {
    const numericId = Number(question.id);
    return Number.isNaN(numericId) ? null : numericId;
  }

  function getStudentAnswerForQuestion(student: ExerciseSubmissions, question: Question): AnswerData | undefined {
    if (!student?.answers) return undefined;

    const questionId = toNumericQuestionId(question);
    if (questionId === null) return undefined;

    const submittedAnswer = student.answers.find((answer) => answer.questionId === questionId);
    if (
      !submittedAnswer?.answerData ||
      typeof submittedAnswer.answerData !== 'object' ||
      !('type' in submittedAnswer.answerData)
    )
      return undefined;

    return submittedAnswer.answerData;
  }
</script>

{#if isLoading}
  <Spinner />
{:else if $submissions?.length}
  <div class="mt-2 mb-5 flex w-full gap-1 overflow-auto">
    {#each $submissions as student, i (student.id)}
      <button onclick={() => (studentSelected = i)} class="flex w-20 flex-col items-center">
        <div
          class={`flex h-12 w-12 items-center justify-center rounded-full ${
            studentSelected == i ? 'border-primary-700 border-[3px]' : ''
          }`}
        >
          <img
            src={student.groupmember?.profile.avatarUrl ? student.groupmember.profile.avatarUrl : defaultImg}
            alt={$t('course.navItem.lessons.exercises.all_exercises.analytics.individual.student_avatar')}
            class="m-1 max-h-10 w-10 rounded-full bg-white"
          />
        </div>
        <p class="line-clamp-2 w-20 leading-4 whitespace-pre-wrap">
          {student.groupmember?.profile.fullname ?? ''}
        </p>
      </button>
    {/each}
  </div>

  <p class="mb-2 font-medium">
    {$submissions[studentSelected].groupmember?.profile.fullname ?? ''}'s {$t(
      'course.navItem.lessons.exercises.all_exercises.analytics.individual.answers'
    )}
  </p>
  {#if $submissions[studentSelected]}
    {#if $questionnaire.questions}
      {#each $questionnaire.questions as q, i (`${q.id}-${i}`)}
        <div class="pb-4">
          <ExerciseQuestion.QuestionRenderer
            contract={{
              mode: 'view',
              question: { ...toExerciseQuestionModel(q), title: `${i + 1}. ${q.title}` },
              answer: getStudentAnswerForQuestion($submissions[studentSelected], q),
              labels: questionLabels,
              disabled: true
            }}
          />
        </div>
      {/each}
    {/if}
  {/if}
{/if}
