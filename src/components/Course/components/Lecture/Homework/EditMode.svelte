<script>
  import {
    questionnaire,
    handleAddOption,
    handleRemoveOption,
    handleRemoveQuestion,
    handleCode,
  } from "./store/index";
  import Delete24 from "carbon-icons-svelte/lib/Delete24";
  import AddFilled24 from "carbon-icons-svelte/lib/AddFilled24";

  import TextField from "../../../../Form/TextField.svelte";
  import TextArea from "../../../../Form/TextArea.svelte";
  import Checkbox from "../../../../Form/Checkbox.svelte";
  import RadioItem from "../../../../Form/RadioItem.svelte";
  import IconButton from "../../../../IconButton/index.svelte";
  import PrimaryButton from "../../../../PrimaryButton/index.svelte";
  import Dropdown from "../../../../Dropdown/index.svelte";
  import { VARIANTS } from "../../../../PrimaryButton/constants";
  import Select from "../../../../Form/Select.svelte";
  import QuestionContainer from "../../../../QuestionContainer/index.svelte";
  import {
    QUESTION_TYPE,
    QUESTION_TYPES,
  } from "../../../../Question/constants";
  // import EditContent from "../../../../EditContent/index.svelte";
  // import readme from "../../readme.js";

  // let value = readme;
  const extraActions = ["Code Snippets", "Upload image"];
  const initialQuestionsLength = $questionnaire.questions.length;

  function shouldScrollToLast(index, questions) {
    const currentQuestionsLength = questions.length;
    const isLast = index + 1 === currentQuestionsLength;

    return isLast && initialQuestionsLength !== currentQuestionsLength;
  }

  function handleOptionClick(questionIndex) {
    return (actionIndex) => {
      switch (actionIndex) {
        case 0:
          handleCode(questionIndex, true);
          break;
        case 1:
          // uploadImage(questionIndex);
          break;
        default:
          console.log("No option");
      }
    };
  }
</script>

<div class="w-auto m-auto">
  <QuestionContainer isTitle={true}>
    <TextField
      placeholder="Title"
      bind:value={$questionnaire.title}
      className="mb-2"
    />
    <TextArea
      placeholder="Description and Rules"
      bind:value={$questionnaire.description}
    />
  </QuestionContainer>

  {#each $questionnaire.questions as question, index}
    <QuestionContainer
      onClose={handleRemoveQuestion(question.id)}
      scrollToQuestion={shouldScrollToLast(index, $questionnaire.questions)}
    >
      <div class="flex justify-between items-center">
        <div class="mr-2 w-3/5">
          <TextField placeholder="Question" bind:value={question.title} />
        </div>

        <Dropdown
          options={extraActions}
          handleOptionClick={handleOptionClick(question.id)}
        >
          <AddFilled24 class="carbon-icon" />
          <p class="ml-2 text-gray-600">Add</p>
        </Dropdown>

        <Select bind:value={question.type} options={QUESTION_TYPES} />
      </div>

      {#if typeof question.code === "string"}
        <div class="flex justify-between items-center my-3 w-3/5">
          <TextArea
            bind:value={question.code}
            rows="2"
            placeholder="Write your code"
          />
          <IconButton
            value="write-code"
            onClick={() => handleCode(question.id, false)}
          >
            <Delete24 class="carbon-icon" />
          </IconButton>
        </div>
      {/if}

      <div class="flex flex-col mt-2">
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
                  onClick={handleRemoveOption(question.id, option.id)}
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
                  onClick={handleRemoveOption(question.id, option.id)}
                >
                  <Delete24 class="carbon-icon" />
                </IconButton>
              </div>
            </Checkbox>
          {/if}

          {#if QUESTION_TYPE.TEXTAREA === question.type}
            <TextArea bind:value={option.value} />
          {/if}
        {/each}
      </div>

      {#if QUESTION_TYPE.TEXTAREA !== question.type}
        <div class="flex items-center mt-3">
          <PrimaryButton
            disablePadding={true}
            className="p-2"
            variant={VARIANTS.OUTLINED}
            onClick={handleAddOption(question.id)}
          >
            <AddFilled24 class="carbon-icon" />
            <p class="ml-2">Add option</p>
          </PrimaryButton>
        </div>
      {/if}
    </QuestionContainer>
  {/each}
</div>
