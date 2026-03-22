<script lang="ts">
  import { getExerciseQuestionContractKey } from '@cio/question-types';
  import type { AnswerData, ExerciseQuestionModel } from '@cio/question-types';
  import type { Question } from '$features/course/types';
  import { Grade, ReasonBox } from '$features/ui/question';
  import { toExerciseQuestionModel } from './question-type-utils';
  import { getExerciseQuestionLabels } from './question-labels';
  import { ExerciseQuestion } from '@cio/ui';
  import type { QuestionnaireMetaData } from './store';

  interface Props {
    questions?: Question[];
    questionnaireMetaData?: Partial<QuestionnaireMetaData>;
    /** Per-question scores (e.g. from `questionnaireMetaData.grades` or grading modal `questionAnswerByPoint`). */
    grades?: Record<string, number>;
    disableGrading?: boolean;
    isGradeWithAI?: boolean;
    isLoading?: boolean;
    /** Optional AI grading copy keyed by question id. */
    reasons?: Record<string, string>;
  }

  let {
    questions = [],
    questionnaireMetaData: _questionnaireMetaData = {},
    grades = $bindable({}),
    disableGrading = true,
    isGradeWithAI = $bindable(false),
    isLoading = $bindable(false),
    reasons = $bindable({})
  }: Props = $props();

  function acceptGradeSuggestion() {
    isGradeWithAI = false;
  }

  function rejectGradeSuggestion(questionId: Question['id']) {
    isGradeWithAI = false;
    grades[String(questionId)] = 0;
  }

  function getAnswerForQuestion(questionModel: ExerciseQuestionModel, fallbackIndex = 0): AnswerData | undefined {
    const questionKey = getExerciseQuestionContractKey(questionModel, fallbackIndex);
    return _questionnaireMetaData?.answers?.[questionKey];
  }

  const questionModels = $derived(questions.map((question) => toExerciseQuestionModel(question)));
  const questionLabels = $derived(getExerciseQuestionLabels());
  const answersByKey = $derived(
    questionModels.reduce(
      (acc, questionModel, index) => {
        const questionKey = getExerciseQuestionContractKey(questionModel, index);
        acc[questionKey] = _questionnaireMetaData?.answers?.[questionKey];
        return acc;
      },
      {} as Record<string, AnswerData>
    )
  );
</script>

{#if disableGrading && !Object.keys(grades || {}).length}
  <ExerciseQuestion.QuestionList
    contract={{ mode: 'review', questions: questionModels, answersByKey, labels: questionLabels, disabled: true }}
    itemClass="mb-4"
  />
{:else if disableGrading && Object.keys(grades || {}).length}
  {#each questions as currentQuestion, index (currentQuestion.id)}
    {@const questionModel = questionModels[index]}
    <div class="mb-4 space-y-3">
      <div class="flex items-center justify-between">
        <p class="text-base font-semibold text-gray-700 dark:text-gray-200">Q{index + 1}</p>
        <Grade grade={grades[currentQuestion.id]} gradeMax={currentQuestion.points} disableGrading={true} />
      </div>

      <ExerciseQuestion.QuestionRenderer
        contract={{
          mode: 'review',
          question: questionModel,
          answer: getAnswerForQuestion(questionModel, index),
          labels: questionLabels,
          disabled: true
        }}
      />
    </div>
  {/each}
{:else}
  {#each questions as currentQuestion, index (currentQuestion.id)}
    {@const questionModel = questionModels[index]}
    <div class="mb-4 space-y-3">
      <div class="flex items-center justify-between">
        <p class="text-base font-semibold text-gray-700 dark:text-gray-200">Q{index + 1}</p>
        <Grade bind:grade={grades[currentQuestion.id]} gradeMax={currentQuestion.points} {disableGrading} />
      </div>

      <ExerciseQuestion.QuestionRenderer
        contract={{
          mode: 'review',
          question: questionModel,
          answer: getAnswerForQuestion(questionModel, index),
          labels: questionLabels,
          disabled: true
        }}
      />

      {#if isGradeWithAI}
        <ReasonBox
          reason={reasons[currentQuestion.id]}
          {isLoading}
          acceptGrade={acceptGradeSuggestion}
          rejectGrade={() => rejectGradeSuggestion(currentQuestion.id)}
        />
      {/if}
    </div>
  {/each}
{/if}
