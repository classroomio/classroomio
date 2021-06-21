<script>
  import Delete24 from "carbon-icons-svelte/lib/Delete24";
  import AddFilled24 from "carbon-icons-svelte/lib/AddFilled24";

  import TextField from "../../../../Form/TextField.svelte";
  import Checkbox from "../../../../Form/Checkbox.svelte";
  import RadioItem from "../../../../Form/RadioItem.svelte";
  import IconButton from "../../../../IconButton/index.svelte";
  import Select from "../../../../Form/Select.svelte";
  import PrimaryButton from "../../../../PrimaryButton/index.svelte";
  import {
    QUESTION_TYPE,
    QUESTION_TYPES,
  } from "../../../../Question/constants";
  // import EditContent from "../../../../EditContent/index.svelte";
  // import readme from "../../readme.js";

  // let value = readme;

  let questions = [
    {
      id: 1,
      title: "",
      type: QUESTION_TYPE.RADIO,
      options: [
        {
          id: 1,
          value: "",
        },
      ],
    },
  ];

  function handleAddOption(id) {
    return () => {
      questions = questions.map((question) => {
        if (question.id === id) {
          return {
            ...question,
            options: [
              ...question.options,
              {
                id: question.options.length + 1,
                value: "",
              },
            ],
          };
        }

        return question;
      });
    };
  }

  function handleOptionRemove(questionId, optionId) {
    return () => {
      questions = questions.map((question) => {
        if (question.id === questionId) {
          return {
            ...question,
            options: [
              ...question.options.filter((option) => option.id !== optionId),
            ],
          };
        }

        return question;
      });
    };
  }

  function handleAddQuestion() {
    questions = [
      ...questions,
      {
        id: questions.length + 1,
        title: "",
        type: QUESTION_TYPE.RADIO,
        options: [
          {
            id: 1,
            value: "",
          },
        ],
      },
    ];
  }
</script>

{#each questions as question}
  <div
    class="border-2 border-gray border-r-2 rounded-md px-4 py-2 mb-4 w-3/5 inline-block"
  >
    <div class="flex">
      <div class="mr-2">
        <TextField placeholder="Question" bind:value={question.title} />
      </div>
      <Select bind:value={question.type} options={QUESTION_TYPES} />
    </div>

    <div class="flex flex-col">
      {#each question.options as option}
        {#if QUESTION_TYPE.RADIO === question.type}
          <RadioItem
            isEditable={true}
            name={question.title || "radio-name"}
            bind:label={option.value}
          >
            <div slot="iconbutton">
              <IconButton
                value={option.id}
                onClick={handleOptionRemove(question.id, option.id)}
              >
                <Delete24 class="carbon-icon" />
              </IconButton>
            </div>
          </RadioItem>
        {/if}

        {#if QUESTION_TYPE.CHECKBOX === question.type}
          <Checkbox
            isEditable={true}
            name={question || "checkbox-name"}
            bind:label={option.value}
          >
            <div slot="iconbutton">
              <IconButton
                value={option.id}
                onClick={handleOptionRemove(question.id)}
              >
                <Delete24 class="carbon-icon" />
              </IconButton>
            </div>
          </Checkbox>
        {/if}
      {/each}
    </div>

    <div class="flex items-center">
      <IconButton onClick={handleAddOption(question.id)}>
        <AddFilled24 class="carbon-icon" />
      </IconButton>
      <p class="italic">Add option</p>
    </div>
  </div>
{/each}

<div class="flex justify-end mt-2">
  <PrimaryButton onClick={handleAddQuestion} label="Add Question" />
</div>
