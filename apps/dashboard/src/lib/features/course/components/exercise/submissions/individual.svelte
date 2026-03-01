<script lang="ts">
  import { Spinner } from '@cio/ui/base/spinner';
  import { ExerciseQuestion } from '@cio/ui';

  import { submissions } from './store';
  import { questionnaire } from '../store';
  import { t } from '$lib/utils/functions/translations';
  import type { ExerciseSubmissions } from '$features/course/utils/types';
  import type { Question } from '$features/course/types';
  import { QUESTION_TYPE_KEY, type ExerciseAnswerValue } from '@cio/question-types';
  import { getQuestionTypeKey, toExerciseQuestionModel } from '../question-type-utils';
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

  function getStudentAnswerForQuestion(student: ExerciseSubmissions, question: Question): ExerciseAnswerValue {
    if (!student?.answers) return undefined;

    const questionId = toNumericQuestionId(question);
    if (questionId === null) return undefined;

    const submittedAnswer = student.answers.find((answer) => answer.question_id === questionId);
    if (!submittedAnswer) return undefined;

    const selectedAnswers = Array.isArray(submittedAnswer.answers)
      ? submittedAnswer.answers.filter((answer) => answer !== '')
      : [];

    const questionTypeKey = getQuestionTypeKey(question);
    if (questionTypeKey === QUESTION_TYPE_KEY.CHECKBOX) return selectedAnswers;
    if (questionTypeKey === QUESTION_TYPE_KEY.TRUE_FALSE) {
      const selectedValue = selectedAnswers[0];
      if (selectedValue === undefined) return undefined;

      const matchedOption = (question.options || []).find((option) => {
        return (
          String(option.id ?? '') === String(selectedValue) ||
          String(option.value ?? '')
            .trim()
            .toLowerCase() === String(selectedValue).trim().toLowerCase() ||
          String(option.label ?? '')
            .trim()
            .toLowerCase() === String(selectedValue).trim().toLowerCase()
        );
      });

      const resolvedValue = String(matchedOption?.value ?? matchedOption?.label ?? selectedValue)
        .trim()
        .toLowerCase();
      if (resolvedValue === 'true' || resolvedValue === '1' || resolvedValue === 'yes') return true;
      if (resolvedValue === 'false' || resolvedValue === '0' || resolvedValue === 'no') return false;

      return selectedValue;
    }

    if (questionTypeKey === QUESTION_TYPE_KEY.RADIO) {
      return selectedAnswers[0];
    }

    return submittedAnswer.open_answer ?? '';
  }
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
            alt={$t('course.navItem.lessons.exercises.all_exercises.analytics.individual.student_avatar')}
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
