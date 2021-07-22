<script>
  import RadioQuestion from '../../../../Question/RadioQuestion/index.svelte';
  import CheckboxQuestion from '../../../../Question/CheckboxQuestion/index.svelte';
  import TextareaQuestion from '../../../../Question/TextareaQuestion/index.svelte';
  import { QUESTION_TYPE } from '../../../../Question/constants';
  import { getPropsForQuestion } from './functions';

  export let questions;
  export let questionnaireMetaData;
  export let onSubmit = () => {};
  export let onPrevious = () => {};
</script>

{#each questions as currentQuestion, currentQuestionIndex}
  {#if QUESTION_TYPE.RADIO === currentQuestion.type}
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
    />
  {:else if QUESTION_TYPE.CHECKBOX === currentQuestion.type}
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
    />
  {:else if QUESTION_TYPE.TEXTAREA === currentQuestion.type}
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
    />
  {/if}
{/each}
