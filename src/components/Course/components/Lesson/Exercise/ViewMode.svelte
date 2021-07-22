<script>
  import { questionnaire } from './store/index';
  import { questionnaireMetaData } from './store/answers';
  import Preview from './Preview.svelte';
  import RadioQuestion from '../../../../Question/RadioQuestion/index.svelte';
  import CheckboxQuestion from '../../../../Question/CheckboxQuestion/index.svelte';
  import TextareaQuestion from '../../../../Question/TextareaQuestion/index.svelte';
  import PrimaryButton from '../../../../PrimaryButton/index.svelte';
  import Progress from '../../../../Progress/index.svelte';
  import { removeDuplicate } from '../../../../../utils/functions/removeDuplicate';
  import { QUESTION_TYPE } from '../../../../Question/constants';
  import { STATUS } from './constants';
  import { wasCorrectAnswerSelected, getPropsForQuestion } from './functions';

  export let preview;

  let currentQuestion = {};
  let renderProps = {};

  const { questions, title, description } = $questionnaire;

  function handleStart() {
    $questionnaireMetaData.currentQuestionIndex += 1;
  }

  function onSubmit(id, value) {
    const prevAnswer = $questionnaireMetaData.answers[id] || [];
    const formattedAnswer =
      typeof value === 'string'
        ? value
        : removeDuplicate([...prevAnswer, ...(value || [])]);

    $questionnaireMetaData.answers = {
      ...$questionnaireMetaData.answers,
      [id]: formattedAnswer,
    };
    if (
      wasCorrectAnswerSelected(currentQuestion, $questionnaireMetaData.answers)
    ) {
      $questionnaireMetaData.currentQuestionIndex += 1;
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
      Math.round(((currentQuestionIndex - 1) / questions.length) * 100) || 0
    );
  }

  $: {
    currentQuestion =
      questions[$questionnaireMetaData.currentQuestionIndex - 1];
    if ($questionnaireMetaData.currentQuestionIndex > 0 && !currentQuestion) {
      $questionnaireMetaData.isFinished = true;
    }

    if (currentQuestion) {
      renderProps = getPropsForQuestion(
        questions,
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

{#if !preview && questions.length && !$questionnaireMetaData.isFinished}
  <Progress value={$questionnaireMetaData.progressValue} />
{/if}

{#if preview}
  <Preview {questions} questionnaireMetaData={$questionnaireMetaData} />
{:else if !questions.length}
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
    <h2 class="my-1">{title}</h2>
    <p>{description}</p>

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
      <h2 class="text-xl mb-2 mt-0">{title}</h2>
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
  <Preview {questions} questionnaireMetaData={$questionnaireMetaData} />
{:else if QUESTION_TYPE.RADIO === currentQuestion.type}
  <RadioQuestion {...renderProps} />
{:else if QUESTION_TYPE.CHECKBOX === currentQuestion.type}
  <CheckboxQuestion {...renderProps} />
{:else if QUESTION_TYPE.TEXTAREA === currentQuestion.type}
  <TextareaQuestion {...renderProps} />
{/if}
