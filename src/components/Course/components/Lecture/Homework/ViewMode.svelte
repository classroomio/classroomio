<script>
  import { questionnaire } from "./store/index";
  // import RadioQuestion from "../../../../Question/RadioQuestion/index.svelte";
  import CheckboxQuestion from "../../../../Question/CheckboxQuestion/index.svelte";
  import PrimaryButton from "../../../../PrimaryButton/index.svelte";

  let answers = {};
  let currentQuestionIndex = 0;
  let currentQuestion = {};

  const { questions, title, description } = $questionnaire;

  function handleStart() {
    currentQuestionIndex += 1;
  }

  function onSubmit(name, value) {
    if (!value) return;
    answers = {
      ...answers,
      [name]: value,
    };
    currentQuestionIndex += 1;
  }

  function onCheckboxSubmit(name, value) {
    if (!value) return;

    answers = {
      ...answers,
      [name]: value,
    };

    currentQuestionIndex += 1;
  }

  $: currentQuestion = questions[currentQuestionIndex - 1];

  function onPrevious() {
    currentQuestionIndex -= 1;
  }
</script>

{#if currentQuestionIndex === 0}
  <div>
    <h2>{title}</h2>
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
{:else}
  <!-- <RadioQuestion
    title={currentQuestionIndex + ". " + currentQuestion.title}
    name={currentQuestion.name}
    options={currentQuestion.options}
    defaultValue={answers[currentQuestion.name] || false}
    {onSubmit}
    {onPrevious}
    disablePreviousButton={currentQuestionIndex === 1}
    isLast={currentQuestionIndex === questions.length}
  /> -->
  <CheckboxQuestion
    title={currentQuestionIndex + ". " + currentQuestion.title}
    name={`${currentQuestion.id}`}
    options={currentQuestion.options}
    defaultValue={answers[currentQuestion.id] || []}
    onSubmit={onCheckboxSubmit}
    {onPrevious}
    disablePreviousButton={currentQuestionIndex === 1}
    isLast={currentQuestionIndex === questions.length}
  />
{/if}
