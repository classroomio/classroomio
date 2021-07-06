<script>
  import { questionnaire } from "./store/index";
  import RadioQuestion from "../../../../Question/RadioQuestion/index.svelte";
  import CheckboxQuestion from "../../../../Question/CheckboxQuestion/index.svelte";
  import TextareaQuestion from "../../../../Question/TextareaQuestion/index.svelte";
  import PrimaryButton from "../../../../PrimaryButton/index.svelte";
  import Progress from "../../../../Progress/index.svelte";
  import { removeDuplicate } from "../../../../../utils/functions/removeDuplicate";
  import { QUESTION_TYPE } from "../../../../Question/constants";

  export let preview;

  let answers = {};
  let currentQuestionIndex = 0;
  let currentQuestion = {};
  let renderProps = {};
  let progressValue = 0;
  let isAnswerCorrect;
  let isFinished;

  const { questions, title, description } = $questionnaire;

  function handleStart() {
    currentQuestionIndex += 1;
  }

  function onSubmit(id, value) {
    const prevAnswer = answers[id] || [];
    const formattedAnswer =
      typeof value === "string"
        ? value
        : removeDuplicate([...prevAnswer, ...(value || [])]);

    answers = {
      ...answers,
      [id]: formattedAnswer,
    };

    if (isAnswerCorrect) {
      currentQuestionIndex += 1;
    }
  }

  function onPrevious() {
    currentQuestionIndex -= 1;
  }

  function wasCorrectAnswerSelected(currentQuestion) {
    const isOpenQuesiton = currentQuestion.type === QUESTION_TYPE.TEXTAREA;

    if (isOpenQuesiton) {
      isAnswerCorrect = true;
      return true;
    }
    const answer = answers[currentQuestion.id];
    const formattedAnswers = typeof answer === "string" ? [answer] : answer;
    const options = currentQuestion.options;

    isAnswerCorrect =
      formattedAnswers &&
      formattedAnswers.some((answer) => {
        if (
          !currentQuestion.answers ||
          !currentQuestion.answers.length ||
          currentQuestion.answers.includes(answer)
        ) {
          return true;
        }

        return false;
      });

    return isAnswerCorrect;
  }

  function getRenderProps(question, questionIndex, answers) {
    const isLast = questionIndex === questions.length;
    const isOpenQuesiton = question.type === QUESTION_TYPE.TEXTAREA;

    return {
      title: questionIndex + ". " + question.title,
      name: `${question.id}`,
      options: question.options,
      answers: question.answers,
      code: question.code,
      defaultValue: isOpenQuesiton
        ? answers[question.id] || ""
        : answers[question.id] || [],
      onSubmit,
      onPrevious,
      disablePreviousButton: questionIndex === 1,
      isLast,
      isPreview: preview || isFinished,
      disabled: wasCorrectAnswerSelected(question) && isFinished,
      nextButtonProps: isLast
        ? {
            label: "Finish",
            isActive: true,
          }
        : isOpenQuesiton
        ? {
            label: "Next",
            isActive: true,
          }
        : wasCorrectAnswerSelected(question)
        ? {
            label: "Next",
            isActive: true,
            disableOptionSelect: true,
          }
        : {
            label: "Check",
            isActive: false,
          },
    };
  }

  function getProgressValue(currentQuestionIndex) {
    if (isFinished) {
      return 100;
    }

    return (
      Math.round(((currentQuestionIndex - 1) / questions.length) * 100) || 0
    );
  }

  $: {
    currentQuestion = questions[currentQuestionIndex - 1];
    if (currentQuestionIndex > 0 && !currentQuestion) {
      isFinished = true;
    }

    if (currentQuestion) {
      renderProps = getRenderProps(
        currentQuestion,
        currentQuestionIndex,
        answers
      );
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
    {#if QUESTION_TYPE.RADIO === currentQuestion.type}
      <RadioQuestion
        {...getRenderProps(currentQuestion, currentQuestionIndex + 1, answers)}
      />
    {:else if QUESTION_TYPE.CHECKBOX === currentQuestion.type}
      <CheckboxQuestion
        {...getRenderProps(currentQuestion, currentQuestionIndex + 1, answers)}
      />
    {:else if QUESTION_TYPE.TEXTAREA === currentQuestion.type}
      <TextareaQuestion
        {...getRenderProps(currentQuestion, currentQuestionIndex + 1, answers)}
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
{:else if isFinished}
  <h2 class="text-lg">Congratulations you have completed your task</h2>
  {#each questions as currentQuestion, currentQuestionIndex}
    {#if QUESTION_TYPE.RADIO === currentQuestion.type}
      <RadioQuestion
        {...getRenderProps(currentQuestion, currentQuestionIndex + 1, answers)}
      />
    {:else if QUESTION_TYPE.CHECKBOX === currentQuestion.type}
      <CheckboxQuestion
        {...getRenderProps(currentQuestion, currentQuestionIndex + 1, answers)}
      />
    {:else if QUESTION_TYPE.TEXTAREA === currentQuestion.type}
      <TextareaQuestion
        {...getRenderProps(currentQuestion, currentQuestionIndex + 1, answers)}
      />
    {/if}
  {/each}
{:else if QUESTION_TYPE.RADIO === currentQuestion.type}
  <RadioQuestion {...renderProps} />
{:else if QUESTION_TYPE.CHECKBOX === currentQuestion.type}
  <CheckboxQuestion {...renderProps} />
{:else if QUESTION_TYPE.TEXTAREA === currentQuestion.type}
  <TextareaQuestion {...renderProps} />
{/if}
