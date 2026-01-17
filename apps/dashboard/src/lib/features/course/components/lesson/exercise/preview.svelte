<script lang="ts">
  import { CheckboxQuestion, RadioQuestion, TextareaQuestion } from '$features/ui/question';
  import { QUESTION_TYPE } from '@cio/utils/validation/constants';
  import { getPropsForQuestion } from './functions';

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
    questionnaireMetaData = {},
    grades = $bindable({}),
    onSubmit = () => {},
    onPrevious = () => {},
    disableGrading = true,
    isGradeWithAI = $bindable(false),
    isLoading = $bindable(false),
    reasons = $bindable({})
  }: Props = $props();
</script>

{#each questions as currentQuestion, currentQuestionIndex}
  {#if QUESTION_TYPE.RADIO === currentQuestion.questionType.id}
    <RadioQuestion
      {...getPropsForQuestion(
        questions,
        currentQuestion,
        questionnaireMetaData,
        currentQuestionIndex + 1,
        onSubmit,
        onPrevious,
        true
      )}
      bind:grade={grades[currentQuestion.id]}
      bind:isGradeWithAI
      bind:reason={reasons[currentQuestion.id]}
      bind:isLoading
      gradeMax={currentQuestion.points}
      {disableGrading}
      disabled={true}
    />
  {:else if QUESTION_TYPE.CHECKBOX === currentQuestion.questionType.id}
    <CheckboxQuestion
      {...getPropsForQuestion(
        questions,
        currentQuestion,
        questionnaireMetaData,
        currentQuestionIndex + 1,
        onSubmit,
        onPrevious,
        true
      )}
      bind:grade={grades[currentQuestion.id]}
      bind:isGradeWithAI
      bind:reason={reasons[currentQuestion.id]}
      bind:isLoading
      gradeMax={currentQuestion.points}
      {disableGrading}
      disabled={true}
    />
  {:else if QUESTION_TYPE.TEXTAREA === currentQuestion.questionType.id}
    <TextareaQuestion
      {...getPropsForQuestion(
        questions,
        currentQuestion,
        questionnaireMetaData,
        currentQuestionIndex + 1,
        onSubmit,
        onPrevious,
        true
      )}
      bind:grade={grades[currentQuestion.id]}
      bind:isGradeWithAI
      bind:reason={reasons[currentQuestion.id]}
      bind:isLoading
      gradeMax={currentQuestion.points}
      {disableGrading}
      disabled={true}
    />
  {/if}
{/each}
