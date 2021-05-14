<script>
  import RadioQuestion from "../../../RadioQuestion/index.svelte";
  import PrimaryButton from "../../../PrimaryButton/index.svelte";

  let answers = {};
  let currentQuestionIndex = 0;
  let currentQuestion = {};

  const questions = [
    {
      name: "react-founder",
      type: "radio",
      title: "Who is the creator of React.js",
      options: [
        {
          label: "Dan Abrahmov",
          value: "danabrahmov",
        },
        {
          label: "Google",
          value: "google",
        },
        {
          label: "Facebook",
          value: "Facebook",
        },
        {
          label: "Traversy Media",
          value: "traversymedia",
        },
      ],
    },
    {
      name: "vue-founder",
      type: "radio",
      title: "Who is the creator of Vue.js",
      options: [
        {
          label: "Evan Vue",
          value: "evan-vue",
        },
        {
          label: "Mark Zukerberg",
          value: "mark",
        },
        {
          label: "Prince Charles",
          value: "prince-charles",
        },
        {
          label: "Bill Gates",
          value: "gates-bill",
        },
      ],
    },
    {
      name: "svelte-founder",
      type: "radio",
      title: "Who is the creator of Svelte.js",
      options: [
        {
          label: "Hillary Svelte",
          value: "danabrahmov",
        },
        {
          label: "Mircosoft",
          value: "microsoft",
        },
        {
          label: "Elevate",
          value: "elevate",
        },
        {
          label: "Coding Train",
          value: "coding-train",
        },
      ],
    },
    {
      name: "angular-founder",
      type: "radio",
      title: "Who is the creator of Angular.js",
      options: [
        {
          label: "Laryy page",
          value: "larry-page",
        },
        {
          label: "Google",
          value: "google",
        },
        {
          label: "Sales Force",
          value: "sales-force",
        },
      ],
    },
  ];

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

  $: currentQuestion = questions[currentQuestionIndex - 1];

  function onPrevious() {
    currentQuestionIndex -= 1;
  }
</script>

{#if currentQuestionIndex === 0}
  <div>
    <h2>Home task 1</h2>
    <p>
      You will be to answer 10 questions, it isn't timed so you can take your
      time to answer. You can also continue from where you left off, you don't
      need to worry cause everything is automatically syncronized in the cloud.
    </p>

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
  <RadioQuestion
    title={currentQuestionIndex + ". " + currentQuestion.title}
    name={currentQuestion.name}
    options={currentQuestion.options}
    defaultValue={answers[currentQuestion.name] || false}
    {onSubmit}
    {onPrevious}
    disablePreviousButton={currentQuestionIndex === 1}
    isLast={currentQuestionIndex === questions.length}
  />
{/if}
