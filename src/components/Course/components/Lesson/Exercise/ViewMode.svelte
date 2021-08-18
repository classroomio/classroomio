<script>
  import { fade, fly, slide } from 'svelte/transition';
  import { group, course } from '../../../store';
  import { questionnaire } from '../store/exercise';
  import { questionnaireMetaData } from '../store/answers';
  import Preview from './Preview.svelte';
  import RadioQuestion from '../../../../Question/RadioQuestion/index.svelte';
  import CheckboxQuestion from '../../../../Question/CheckboxQuestion/index.svelte';
  import TextareaQuestion from '../../../../Question/TextareaQuestion/index.svelte';
  import PrimaryButton from '../../../../PrimaryButton/index.svelte';
  import Progress from '../../../../Progress/index.svelte';
  import { removeDuplicate } from '../../../../../utils/functions/removeDuplicate';
  import { QUESTION_TYPE } from '../../../../Question/constants';
  import { STATUS } from './constants';
  import { getPropsForQuestion, filterOutDeleted } from './functions';
  import { submitExercise } from '../../../../../utils/services/courses';
  import { profile } from '../../../../../utils/store/user';
  export let preview;

  export let exerciseId;

  let currentQuestion = {};
  let renderProps = {};

  function handleStart() {
    $questionnaireMetaData.currentQuestionIndex += 1;
  }

  function onSubmit(id, value, moveToNextQuestion = false) {
    const { answers } = $questionnaireMetaData;
    const { questions } = $questionnaire;

    const prevAnswer = answers[id] || [];
    const formattedAnswer =
      typeof value === 'string'
        ? value
        : removeDuplicate([...prevAnswer, ...(value || [])]);

    $questionnaireMetaData.answers = {
      ...answers,
      [id]: formattedAnswer,
    };

    if (moveToNextQuestion) {
      $questionnaireMetaData.currentQuestionIndex += 1;
    }

    const isFinished =
      !questions[$questionnaireMetaData.currentQuestionIndex - 1];
    console.log(`isFinished`, isFinished);
    console.log(
      `$questionnaireMetaData.currentQuestionIndex`,
      $questionnaireMetaData.currentQuestionIndex
    );

    // If last question send to server
    if (isFinished) {
      submitExercise(
        $questionnaireMetaData.answers,
        questions,
        exerciseId,
        $course.id,
        $group,
        $profile
      );
    }
  }

  function onPrevious() {
    $questionnaireMetaData.currentQuestionIndex -= 1;
  }

  function getTotalScores() {
    let total = 0;
    for (const score in $questionnaireMetaData.scores) {
      total += parseInt($questionnaireMetaData.scores[score]);
    }

    return total;
  }

  function getProgressValue(currentQuestionIndex) {
    if ($questionnaireMetaData.isFinished) {
      return 100;
    }

    return (
      Math.round(
        ((currentQuestionIndex - 1) / $questionnaire.questions.length) * 100
      ) || 0
    );
  }

  $: {
    currentQuestion =
      $questionnaire.questions[$questionnaireMetaData.currentQuestionIndex - 1];
    if ($questionnaireMetaData.currentQuestionIndex > 0 && !currentQuestion) {
      $questionnaireMetaData.isFinished = true;
    }

    if (currentQuestion) {
      renderProps = getPropsForQuestion(
        $questionnaire.questions,
        currentQuestion,
        $questionnaireMetaData,
        $questionnaireMetaData.currentQuestionIndex,
        onSubmit,
        onPrevious,
        preview
      );
    }
  }

  $: $questionnaireMetaData.progressValue = getProgressValue(
    $questionnaireMetaData.currentQuestionIndex
  );
</script>

{#if !preview && $questionnaire.questions.length && !$questionnaireMetaData.isFinished}
  <Progress value={$questionnaireMetaData.progressValue} />
{/if}

{#if preview}
  <Preview
    questions={filterOutDeleted($questionnaire.questions)}
    questionnaireMetaData={$questionnaireMetaData}
  />
{:else if !$questionnaire.questions.length}
  <div
    class="w-4/5 h-40 m-auto flex items-center justify-center text-center border-2 border-gray-200 rounded-md"
  >
    <h3 class="text-2xl">
      No questions added. <br /> Click the
      <span class="text-blue-700">Edit</span> button to add.
    </h3>
  </div>
{:else if $questionnaireMetaData.currentQuestionIndex === 0}
  <div>
    <h2 class="my-1">{$questionnaire.title}</h2>
    <p>{$questionnaire.description}</p>

    <PrimaryButton
      onClick={handleStart}
      label="Start"
      className="my-5"
      type="button"
    />
  </div>
{:else if $questionnaireMetaData.isFinished}
  <div class="flex items-center justify-between">
    <div class="flex flex-col justify-between">
      <h2 class="text-xl mb-2 mt-0">{$questionnaire.title}</h2>
      {#if STATUS.IN_PROGRESS === $questionnaireMetaData.status}
        <span
          class="bg-yellow-600 text-white rounded-full py-2 px-6 text-center"
          title="Status: Pending Review"
        >
          Pending
        </span>
      {:else if STATUS.REVIEWED === $questionnaireMetaData.status && getTotalScores() > 0}
        <span
          class="bg-green-700 text-white rounded-full py-2 px-6 text-center"
          title="Status: Pending Review"
        >
          Reviewed
        </span>
      {/if}
    </div>

    <span
      class="border-2 border-gray-700 rounded-full h-24 w-24 flex items-center justify-center text-2xl"
      title="Status: Pending Review"
    >
      {getTotalScores()}/100
    </span>
  </div>
  <Preview
    questions={$questionnaire.questions}
    questionnaireMetaData={$questionnaireMetaData}
  />
{:else if currentQuestion}
  {#key currentQuestion.id}
    <!-- <div transition:fade id="question"> -->
    <div in:fly={{ x: 500, duration: 1000 }} id="question">
      {#if QUESTION_TYPE.RADIO === currentQuestion.question_type.id}
        <RadioQuestion {...renderProps} key={currentQuestion.id} />
      {:else if QUESTION_TYPE.CHECKBOX === currentQuestion.question_type.id}
        <CheckboxQuestion {...renderProps} key={currentQuestion.id} />
      {:else if QUESTION_TYPE.TEXTAREA === currentQuestion.question_type.id}
        <TextareaQuestion {...renderProps} key={currentQuestion.id} />
      {/if}
    </div>
  {/key}
{/if}

<style>
  :global(.shake) {
    animation: shake 0.85s;
  }
  @keyframes shake {
    10%,
    90% {
      transform: translate3d(-15px, 0, 0);
    }
    20%,
    80% {
      transform: translate3d(15px, 0, 0);
    }
    30%,
    50%,
    70% {
      transform: translate3d(-15px, 0, 0);
    }
    40%,
    60% {
      transform: translate3d(15px, 0, 0);
    }
  }
</style>
