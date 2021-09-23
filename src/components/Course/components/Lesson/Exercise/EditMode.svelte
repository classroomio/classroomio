<script>
  import {
    questionnaire,
    questionnaireValidation,
    handleAddOption,
    handleRemoveOption,
    handleRemoveQuestion,
    handleCode,
    handleAnswerSelect,
    addDynamicValue,
  } from '../store/exercise';
  import Delete24 from 'carbon-icons-svelte/lib/Delete24';
  import AddFilled24 from 'carbon-icons-svelte/lib/AddFilled24';
  import CheckmarkFilled24 from 'carbon-icons-svelte/lib/CheckmarkFilled24';
  import CheckmarkOutline24 from 'carbon-icons-svelte/lib/CheckmarkOutline24';
  // import Subtract24 from "carbon-icons-svelte/lib/Subtract24";

  import TextField from '../../../../Form/TextField.svelte';
  import TextArea from '../../../../Form/TextArea.svelte';
  import Checkbox from '../../../../Form/Checkbox.svelte';
  import DateTime from '../../../../Form/DateTime.svelte';
  import RadioItem from '../../../../Form/RadioItem.svelte';
  import IconButton from '../../../../IconButton/index.svelte';
  import ErrorMessage from '../../../../ErrorMessage/index.svelte';
  import PrimaryButton from '../../../../PrimaryButton/index.svelte';
  import EditContent from '../../../../EditContent/index.svelte';
  import { VARIANTS } from '../../../../PrimaryButton/constants';
  import Select from '../../../../Form/Select.svelte';
  import QuestionContainer from '../../../../QuestionContainer/index.svelte';
  import {
    QUESTION_TYPE,
    QUESTION_TYPES,
  } from '../../../../Question/constants';
  import { filterOutDeleted } from './functions';
  // import EditContent from "../../../../EditContent/index.svelte";
  // import readme from "../../readme.js";

  // let value = readme;
  const extraActions = ['Code Snippets', 'Upload image'];
  const initialQuestionsLength = $questionnaire.questions.length;

  let errors = {};

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
          console.log('No option');
      }
    };
  }

  function getQuestionErrorMsg(errors, question, errorKey) {
    return errors[question.id] ? errors[question.id][errorKey] : null;
  }

  $: errors = $questionnaireValidation;
</script>

<div class="w-11/12 m-auto">
  <QuestionContainer isTitle={true}>
    <TextField
      placeholder="Title"
      bind:value={$questionnaire.title}
      className="mb-2"
      onChange={() => ($questionnaire.is_title_dirty = true)}
    />
    <DateTime
      label="Due by"
      bind:value={$questionnaire.due_by}
      placeholder="2021-03-25"
      className="w-50"
      useTime={true}
      onChange={() => ($questionnaire.is_due_by_dirty = true)}
    />
    <EditContent
      writeLabel="Description"
      bind:value={$questionnaire.description}
      placeholder="Start typing your lesson"
      textAreaHeight="100px"
      onInputChange={() => ($questionnaire.is_description_dirty = true)}
    />
  </QuestionContainer>

  {#if Object.values(errors).length}
    <div class="w-full flex justify-center mb-4">
      <ErrorMessage message="You have some errors" />
    </div>
  {/if}

  {#each filterOutDeleted($questionnaire.questions) as question, index}
    <QuestionContainer
      onClose={handleRemoveQuestion(question.id)}
      scrollToQuestion={shouldScrollToLast(index, $questionnaire.questions)}
      bind:points={question.points}
      hasError={!!errors[question.id]}
      onPointsChange={() => {
        question.is_dirty = true;
      }}
    >
      <div class="flex justify-between items-center">
        <div class="mr-2 w-3/5">
          <TextField
            placeholder="Question"
            bind:value={question.title}
            isRequired={true}
            onChange={() => {
              console.log('title changed', question.title);
              question.is_dirty = true;
            }}
          />
        </div>

        <!-- <Dropdown
          options={extraActions}
          handleOptionClick={handleOptionClick(question.id)}
        >
          <AddFilled24 class="carbon-icon" />
          <p class="ml-2 text-gray-600">Add</p>
        </Dropdown> -->

        <Select
          bind:value={question.question_type}
          options={QUESTION_TYPES}
          onChange={() => {
            question.is_dirty = true;
          }}
        />
      </div>

      {#if typeof question.code === 'string'}
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
        {#if QUESTION_TYPE.RADIO === question.question_type.id}
          {#each filterOutDeleted(question.options) as option}
            <RadioItem
              isEditable={true}
              name={question.title || 'radio-name'}
              bind:label={option.label}
              onChange={addDynamicValue(question.id, option.id)}
            >
              <div slot="iconbutton" class="flex items-center">
                <IconButton
                  value={option.id}
                  onClick={handleRemoveOption(question.id, option.id)}
                >
                  <Delete24 class="carbon-icon" />
                </IconButton>
                <IconButton
                  value={option.id}
                  onClick={handleAnswerSelect(question.id, option.id)}
                  buttonClassName={option.is_correct && 'success'}
                >
                  {#if option.is_correct}
                    <CheckmarkFilled24 class="carbon-icon" />
                  {:else}
                    <CheckmarkOutline24 class="carbon-icon" />
                  {/if}
                </IconButton>
              </div>
            </RadioItem>
          {/each}
        {/if}

        {#if QUESTION_TYPE.CHECKBOX === question.question_type.id}
          {#each filterOutDeleted(question.options) as option}
            <Checkbox
              isEditable={true}
              name={question || 'checkbox-name'}
              bind:label={option.label}
              onChange={addDynamicValue(question.id, option.id)}
            >
              <div slot="iconbutton" class="flex items-center">
                <IconButton
                  value={option.id}
                  onClick={handleRemoveOption(question.id, option.id)}
                >
                  <Delete24 class="carbon-icon" />
                </IconButton>
                <IconButton
                  value={option.id}
                  onClick={handleAnswerSelect(question.id, option.id)}
                  buttonClassName={option.is_correct && 'success'}
                >
                  {#if option.is_correct}
                    <CheckmarkFilled24 class="carbon-icon" />
                  {:else}
                    <CheckmarkOutline24 class="carbon-icon" />
                  {/if}
                </IconButton>
              </div>
            </Checkbox>
          {/each}
        {/if}

        {#if QUESTION_TYPE.TEXTAREA === question.question_type.id}
          <TextArea bind:value={question.value} />
        {/if}

        {#if getQuestionErrorMsg(errors, question, 'option')}
          <ErrorMessage
            message={getQuestionErrorMsg(errors, question, 'option')}
          />
        {/if}
      </div>

      {#if QUESTION_TYPE.TEXTAREA !== question.question_type.id}
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
