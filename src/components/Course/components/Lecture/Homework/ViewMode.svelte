<script>
  import { questionnaire } from "./store/index";
  import RadioQuestion from "../../../../Question/RadioQuestion/index.svelte";
  import CheckboxQuestion from "../../../../Question/CheckboxQuestion/index.svelte";
  import TextareaQuestion from "../../../../Question/TextareaQuestion/index.svelte";
  import PrimaryButton from "../../../../PrimaryButton/index.svelte";
  import Progress from "../../../../Progress/index.svelte";

  import { QUESTION_TYPE } from "../../../../Question/constants";

  export let preview;

  let answers = {};
  let currentQuestionIndex = 0;
  let currentQuestion = {};
  let renderProps = {};
  let progressValue = 0;

  const { questions, title, description } = $questionnaire;

  function handleStart() {
    currentQuestionIndex += 1;
  }

  function onSubmit(name, value) {
    // if (!value) return;
    answers = {
      ...answers,
      [name]: value,
    };
    currentQuestionIndex += 1;
  }

  function onPrevious() {
    currentQuestionIndex -= 1;
  }

  function getRenderProps(question, questionIndex) {
    return {
      title: questionIndex + ". " + question.title,
      name: `${question.id}`,
      options: question.options,
      code: question.code,
      defaultValue:
        question.type === QUESTION_TYPE.TEXTAREA
          ? question.value || ""
          : answers[question.id] || [],
      onSubmit,
      onPrevious,
      disablePreviousButton: questionIndex === 1,
      isLast: questionIndex === questions.length,
      isPreview: preview,
    };
  }

  function getProgressValue(currentQuestionIndex) {
    if (!currentQuestion) {
      return 100;
    }

    return (
      Math.round(((currentQuestionIndex - 1) / questions.length) * 100) || 0
    );
  }

  $: {
    currentQuestion = questions[currentQuestionIndex - 1];

    if (currentQuestion) {
      renderProps = getRenderProps(currentQuestion, currentQuestionIndex);
    }
  }

  $: progressValue = getProgressValue(currentQuestionIndex);
</script>

<!-- <svelte:window on:keydown={handleKeydown} /> -->

{#if !preview && currentQuestionIndex > 0}
  <Progress value={progressValue} />
{/if}

{#if preview}
  {#each questions as currentQuestion, currentQuestionIndex}
    {#if currentQuestionIndex === 0}
      <div class="mb-2">
        <h2 class="my-1">{title}</h2>
        <p>{description}</p>
      </div>
    {:else if !currentQuestion}
      <pre>
      <code>{JSON.stringify(answers)}</code>
    </pre>
    {:else if QUESTION_TYPE.RADIO === currentQuestion.type}
      <RadioQuestion
        {...getRenderProps(currentQuestion, currentQuestionIndex)}
      />
    {:else if QUESTION_TYPE.CHECKBOX === currentQuestion.type}
      <CheckboxQuestion
        {...getRenderProps(currentQuestion, currentQuestionIndex)}
      />
    {:else if QUESTION_TYPE.TEXTAREA === currentQuestion.type}
      <TextareaQuestion
        {...getRenderProps(currentQuestion, currentQuestionIndex)}
      />
    {/if}
  {/each}
{:else if currentQuestionIndex === 0}
  <div>
    <h2 class="my-1">{title}</h2>
    <p>{description}</p>

    <PrimaryButton
      onClick={handleStart}
      label="Start"
      className="my-5"
      type="button"
    />
  </div>
{:else if !currentQuestion}
  <pre>
    <code>{JSON.stringify(answers)}</code>
  </pre>
{:else if QUESTION_TYPE.RADIO === currentQuestion.type}
  <RadioQuestion {...renderProps} />
{:else if QUESTION_TYPE.CHECKBOX === currentQuestion.type}
  <CheckboxQuestion {...renderProps} />
{:else if QUESTION_TYPE.TEXTAREA === currentQuestion.type}
  <TextareaQuestion {...renderProps} />
{/if}
