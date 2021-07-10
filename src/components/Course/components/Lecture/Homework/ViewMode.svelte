<script>
  import { questionnaire } from "./store/index";
  import { userQuestionniareAnswers } from "./store/answers";
  import RadioQuestion from "../../../../Question/RadioQuestion/index.svelte";
  import CheckboxQuestion from "../../../../Question/CheckboxQuestion/index.svelte";
  import TextareaQuestion from "../../../../Question/TextareaQuestion/index.svelte";
  import PrimaryButton from "../../../../PrimaryButton/index.svelte";
  import Progress from "../../../../Progress/index.svelte";
  import { removeDuplicate } from "../../../../../utils/functions/removeDuplicate";
  import { QUESTION_TYPE } from "../../../../Question/constants";

  export let preview;

  let currentQuestion = {};
  let renderProps = {};
  let isAnswerCorrect;

  const { questions, title, description } = $questionnaire;

  function handleStart() {
    $userQuestionniareAnswers.currentQuestionIndex += 1;
  }

  function onSubmit(id, value) {
    const prevAnswer = $userQuestionniareAnswers.answers[id] || [];
    const formattedAnswer =
      typeof value === "string"
        ? value
        : removeDuplicate([...prevAnswer, ...(value || [])]);

    $userQuestionniareAnswers.answers = {
      ...$userQuestionniareAnswers.answers,
      [id]: formattedAnswer,
    };

    if (isAnswerCorrect) {
      $userQuestionniareAnswers.currentQuestionIndex += 1;
    }
  }

  function onPrevious() {
    $userQuestionniareAnswers.currentQuestionIndex -= 1;
  }

  function wasCorrectAnswerSelected(currentQuestion) {
    const isOpenQuesiton = currentQuestion.type === QUESTION_TYPE.TEXTAREA;

    if (isOpenQuesiton) {
      return true;
    }
    const answer = $userQuestionniareAnswers.answers[currentQuestion.id];
    const formattedAnswers = typeof answer === "string" ? [answer] : answer;

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
      isPreview: preview || $userQuestionniareAnswers.isFinished,
      disabled:
        ($userQuestionniareAnswers.isFinished &&
          wasCorrectAnswerSelected(question)) ||
        $userQuestionniareAnswers.isFinished,
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

  function getTotalScores(scoresObject) {
    let total = 0;
    for (const score in scoresObject) {
      total += score;
    }

    return total;
  }

  function getProgressValue(currentQuestionIndex) {
    if ($userQuestionniareAnswers.isFinished) {
      return 100;
    }

    return (
      Math.round(((currentQuestionIndex - 1) / questions.length) * 100) || 0
    );
  }

  $: {
    currentQuestion =
      questions[$userQuestionniareAnswers.currentQuestionIndex - 1];
    if (
      $userQuestionniareAnswers.currentQuestionIndex > 0 &&
      !currentQuestion
    ) {
      $userQuestionniareAnswers.isFinished = true;
    }

    if (currentQuestion) {
      renderProps = getRenderProps(
        currentQuestion,
        $userQuestionniareAnswers.currentQuestionIndex,
        $userQuestionniareAnswers.answers
      );
    }
  }

  $: $userQuestionniareAnswers.progressValue = getProgressValue(
    $userQuestionniareAnswers.currentQuestionIndex
  );
</script>

<!-- <svelte:window on:keydown={handleKeydown} /> -->

{#if !preview && !$userQuestionniareAnswers.isFinished}
  <Progress value={$userQuestionniareAnswers.progressValue} />
{/if}

{#if preview}
  {#each questions as currentQuestion, currentQuestionIndex}
    {#if QUESTION_TYPE.RADIO === currentQuestion.type}
      <RadioQuestion
        {...getRenderProps(
          currentQuestion,
          currentQuestionIndex + 1,
          $userQuestionniareAnswers.answers
        )}
      />
    {:else if QUESTION_TYPE.CHECKBOX === currentQuestion.type}
      <CheckboxQuestion
        {...getRenderProps(
          currentQuestion,
          currentQuestionIndex + 1,
          $userQuestionniareAnswers.answers
        )}
      />
    {:else if QUESTION_TYPE.TEXTAREA === currentQuestion.type}
      <TextareaQuestion
        {...getRenderProps(
          currentQuestion,
          currentQuestionIndex + 1,
          $userQuestionniareAnswers.answers
        )}
      />
    {/if}
  {/each}
{:else if $userQuestionniareAnswers.currentQuestionIndex === 0}
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
{:else if $userQuestionniareAnswers.isFinished}
  <div class="flex items-center justify-between">
    <div class="flex flex-col justify-between">
      <h2 class="text-xl mb-2 mt-0">{title}</h2>
      <span
        class="bg-green-700 text-white rounded-full py-2 px-6 text-center"
        title="Status: Pending Review"
      >
        Pending Review
      </span>
    </div>

    <span
      class="border-2 border-gray-700 rounded-full h-24 w-24 flex items-center justify-center text-2xl"
      title="Status: Pending Review"
    >
      {getTotalScores($userQuestionniareAnswers.scores)}/100
    </span>
  </div>
  {#each questions as currentQuestion, currentQuestionIndex}
    {#if QUESTION_TYPE.RADIO === currentQuestion.type}
      <RadioQuestion
        {...getRenderProps(
          currentQuestion,
          currentQuestionIndex + 1,
          $userQuestionniareAnswers.answers
        )}
      />
    {:else if QUESTION_TYPE.CHECKBOX === currentQuestion.type}
      <CheckboxQuestion
        {...getRenderProps(
          currentQuestion,
          currentQuestionIndex + 1,
          $userQuestionniareAnswers.answers
        )}
      />
    {:else if QUESTION_TYPE.TEXTAREA === currentQuestion.type}
      <TextareaQuestion
        {...getRenderProps(
          currentQuestion,
          currentQuestionIndex + 1,
          $userQuestionniareAnswers.answers
        )}
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
