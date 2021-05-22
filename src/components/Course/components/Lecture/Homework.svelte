<script>
  import yaml from "js-yaml";
  import RadioQuestion from "../../../RadioQuestion/index.svelte";
  import PrimaryButton from "../../../PrimaryButton/index.svelte";
  import EditMode from "../../../EditMode/index.svelte";
  import { generateQuestion } from "./functions";

  export let mode;

  let someYamlFile = `
    about: This is the description of the home task
    questions:
    - title: Where is the founder of react?
      type: radio
      options:
        - label: Mark Zukerberg
        - label: Trake Towa
        - label: Emeka Igwe
          answer: true
    - title: Who is the founder of react?
      type: radio
      options:
        - label: Evan Vue
          answer: true
        - label: Richard Brandson
        - label: Collison True
  `;
  const questionnaire = yaml.load(someYamlFile, "utf8");
  const questions = generateQuestion(questionnaire.questions);
  let answers = {};
  let currentQuestionIndex = 0;
  let currentQuestion = {};

  function handleStart() {
    currentQuestionIndex += 1;
  }

  function onPrevious() {
    currentQuestionIndex -= 1;
  }

  function onSubmit(name, value) {
    if (!value) return;
    answers = {
      ...answers,
      [name]: value,
    };
    currentQuestionIndex += 1;
  }

  $: currentQuestion = questions[currentQuestionIndex - 1];
</script>

<EditMode value={someYamlFile}>
  <div slot="preview">
    {#if currentQuestionIndex === 0}
      <div>
        <h2>Home task 1</h2>
        <p>{questionnaire.about}</p>

        <PrimaryButton
          onClick={handleStart}
          label="Start"
          className="my-5"
          type="button" />
      </div>
    {:else if !currentQuestion}
      <pre>
      <code>{JSON.stringify(answers)}</code>
    </pre>
    {:else}
      <RadioQuestion
        title={currentQuestionIndex + '. ' + currentQuestion.title}
        name={currentQuestion.name}
        options={currentQuestion.options}
        defaultValue={answers[currentQuestion.name] || false}
        {onSubmit}
        {onPrevious}
        disablePreviousButton={currentQuestionIndex === 1}
        isLast={currentQuestionIndex === questions.length} />
    {/if}
  </div>
</EditMode>
