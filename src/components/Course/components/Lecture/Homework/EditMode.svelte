<script>
  import {
    questionnaire,
    handleAddOption,
    handleAddQuestion,
    handleRemoveOption,
    handleRemoveQuestion,
  } from "./store/index";
  import Delete24 from "carbon-icons-svelte/lib/Delete24";
  import AddFilled24 from "carbon-icons-svelte/lib/AddFilled24";

  import TextField from "../../../../Form/TextField.svelte";
  import TextArea from "../../../../Form/TextArea.svelte";
  import Checkbox from "../../../../Form/Checkbox.svelte";
  import RadioItem from "../../../../Form/RadioItem.svelte";
  import IconButton from "../../../../IconButton/index.svelte";
  import Select from "../../../../Form/Select.svelte";
  import PrimaryButton from "../../../../PrimaryButton/index.svelte";
  import { VARIANTS } from "../../../../PrimaryButton/constants";
  import QuestionContainer from "../../../../QuestionContainer/index.svelte";
  import {
    QUESTION_TYPE,
    QUESTION_TYPES,
  } from "../../../../Question/constants";
  // import EditContent from "../../../../EditContent/index.svelte";
  // import readme from "../../readme.js";

  // let value = readme;
</script>

<div class="root relative">
  <div class="head flex bg-white items-center justify-between sticky right-0">
    <h3>Home task</h3>
    <PrimaryButton
      variant={VARIANTS.OUTLINED}
      onClick={handleAddQuestion}
      label="Add Question"
      mnb
      v
    />
  </div>

  <QuestionContainer isTitle={true}>
    <TextField placeholder="Title" bind:value={$questionnaire.title} />

    <TextArea
      placeholder="Description and Rules"
      bind:value={$questionnaire.description}
    />
  </QuestionContainer>

  {#each $questionnaire.questions as question}
    <QuestionContainer onClose={handleRemoveQuestion(question.id)}>
      <div class="flex justify-between">
        <div class="mr-2 w-3/5">
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
                  onClick={handleRemoveOption(question.id)}
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
        <div class="flex items-center">
          <IconButton onClick={handleAddOption(question.id)}>
            <AddFilled24 class="carbon-icon" />
          </IconButton>
          <p class="italic">Add option</p>
        </div>
      {/if}
    </QuestionContainer>
  {/each}
</div>

<style>
  .root {
    max-width: 700px;
  }

  .head {
    top: 63px;
    z-index: 2;
  }
</style>
