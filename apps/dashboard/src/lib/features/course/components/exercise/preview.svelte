<script lang="ts">
  import { getExerciseQuestionContractKey, type ExerciseAnswerValue } from '@cio/question-types';
  import { Grade, ReasonBox } from '$features/ui/question';
  import { toExerciseQuestionModel } from './question-type-utils';
  import { getExerciseQuestionLabels } from './question-labels';
  import { ExerciseQuestion } from '@cio/ui';

  interface Props {
    questions?: any;
    questionnaireMetaData?: any;
    grades?: any;
    onSubmit?: any;
    onPrevious?: any;
    disableGrading?: boolean;
    isGradeWithAI?: boolean;
    isLoading?: boolean;
    reasons?: any;
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

  function rejectGradeSuggestion(questionId) {
    isGradeWithAI = false;
    grades[questionId] = 0;
  }

  function getAnswerForQuestion(questionModel, fallbackIndex = 0) {
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
      {} as Record<string, ExerciseAnswerValue>
    )
  );
</script>

{#if disableGrading}
  <ExerciseQuestion.QuestionList
    contract={{ mode: 'view', questions: questionModels, answersByKey, labels: questionLabels, disabled: true }}
    itemClass="mb-4"
  />
{:else}
  {#each questions as currentQuestion, index}
    {@const questionModel = questionModels[index]}
    <div class="mb-4 space-y-3">
      <ExerciseQuestion.QuestionRenderer
        contract={{
          mode: 'view',
          question: questionModel,
          answer: getAnswerForQuestion(questionModel, index),
          labels: questionLabels,
          disabled: true
        }}
      />

      <Grade bind:grade={grades[currentQuestion.id]} gradeMax={currentQuestion.points} {disableGrading} />

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
