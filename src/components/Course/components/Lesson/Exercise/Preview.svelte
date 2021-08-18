<script>
  import RadioQuestion from '../../../../Question/RadioQuestion/index.svelte';
  import CheckboxQuestion from '../../../../Question/CheckboxQuestion/index.svelte';
  import TextareaQuestion from '../../../../Question/TextareaQuestion/index.svelte';
  import { QUESTION_TYPE } from '../../../../Question/constants';
  import { getPropsForQuestion } from './functions';

  export let questions = [];
  export let questionnaireMetaData = {};
  export let grades = {};
  export let onSubmit = () => {};
  export let onPrevious = () => {};
  export let handleGrade = () => {};
</script>

{#each questions as currentQuestion, currentQuestionIndex}
  {#if QUESTION_TYPE.RADIO === currentQuestion.question_type.id}
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
      bind:grade={grades[currentQuestion.name]}
      gradeMax={currentQuestion.points}
      handleGrade={handleGrade(currentQuestion.name)}
    />
  {:else if QUESTION_TYPE.CHECKBOX === currentQuestion.question_type.id}
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
      bind:grade={grades[currentQuestion.name]}
      gradeMax={currentQuestion.points}
      handleGrade={handleGrade(currentQuestion.name)}
    />
  {:else if QUESTION_TYPE.TEXTAREA === currentQuestion.question_type.id}
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
      bind:grade={grades[currentQuestion.name]}
      gradeMax={currentQuestion.points}
      handleGrade={handleGrade(currentQuestion.name)}
    />
  {/if}
{/each}
