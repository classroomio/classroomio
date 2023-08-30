<script>
  import {
    questionnaire,
    deleteConfirmation,
    questionnaireValidation,
    handleAddOption,
    handleRemoveOption,
    handleRemoveQuestion,
    handleCode,
    handleAnswerSelect,
    addDynamicValue
  } from '../store/exercise';
  import TrashCanIcon from 'carbon-icons-svelte/lib/TrashCan.svelte';
  import AddFilledIcon from 'carbon-icons-svelte/lib/AddFilled.svelte';
  import CheckmarkFilledIcon from 'carbon-icons-svelte/lib/CheckmarkFilled.svelte';
  import CheckmarkOutlineIcon from 'carbon-icons-svelte/lib/CheckmarkOutline.svelte';

  import TextField from '$lib/components/Form/TextField.svelte';
  import Modal from '$lib/components/Modal/index.svelte';
  import TextArea from '$lib/components/Form/TextArea.svelte';
  import Checkbox from '$lib/components/Form/Checkbox.svelte';
  import RadioItem from '$lib/components/Form/RadioItem.svelte';
  import IconButton from '$lib/components/IconButton/index.svelte';
  import ErrorMessage from '$lib/components/ErrorMessage/index.svelte';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import { VARIANTS } from '$lib/components/PrimaryButton/constants';
  import Select from '$lib/components/Form/Select.svelte';
  import QuestionContainer from '$lib/components/QuestionContainer/index.svelte';
  import DeleteConfirmationModal from './DeleteConfirmation.svelte';
  import OrderModal from './OrderModal.svelte';
  import { QUESTION_TYPE, QUESTION_TYPES } from '$lib/components/Question/constants';
  import { filterOutDeleted } from './functions';
  import { deleteExercise } from '$lib/utils/services/courses';
  import { lesson } from '../store/lessons';

  // import EditContent from "$lib/components/EditContent/index.svelte";

  // let value = readme;
  const extraActions = ['Code Snippets', 'Upload image'];
  const initialQuestionsLength = $questionnaire.questions.length;

  export let editDescription = false;
  export let exerciseId;
  export let goBack = () => {};

  let errors = {};
  let questionIdToDelete = null;
  let questions = [];
  let isDeleting = false;

  function shouldScrollToLast(questionId, questions) {
    const [lastQuestion] = questions.slice(-1);
    const currentQuestionsLength = questions.length;
    const isLast = lastQuestion.id === questionId;

    return isLast && initialQuestionsLength !== currentQuestionsLength;
  }

  function onInitDeleteClicked(questionId) {
    return () => {
      questionIdToDelete = questionId;
      $deleteConfirmation.open = true;
    };
  }

  function onFinalDeleteClicked() {
    handleRemoveQuestion(questionIdToDelete)();
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

  async function handleDelete() {
    console.log('delete');
    isDeleting = true;
    await deleteExercise(questions, exerciseId);

    lesson.update((_lesson) => ({
      ..._lesson,
      exercises: _lesson.exercises.filter((exercise) => exercise.id !== exerciseId)
    }));
    goBack();
  }

  $: errors = $questionnaireValidation;
  $: questions = filterOutDeleted($questionnaire.questions);
</script>

<DeleteConfirmationModal
  onCancel={() => (questionIdToDelete = null)}
  onDelete={onFinalDeleteClicked}
/>

<OrderModal />

<Modal
  onClose={() => (editDescription = false)}
  bind:open={editDescription}
  width="w-2/4"
  modalHeading="Update description"
>
  <form on:submit|preventDefault>
    <h1 class="dark:text-white text-2xl">Are you sure?</h1>

    <div class="mt-5 flex items-center justify-between">
      <PrimaryButton
        className="px-6 py-3"
        variant={VARIANTS.OUTLINED}
        label="No, cancel"
        type="submit"
        onClick={() => (editDescription = false)}
      />
      <PrimaryButton
        className="px-6 py-3"
        variant={VARIANTS.CONTAINED}
        label={isDeleting ? 'Deleting...' : 'Yes, delete'}
        isDisabled={isDeleting}
        onClick={handleDelete}
      />
    </div>
  </form>
</Modal>

<div class="w-full">
  {#if Object.values(errors).length}
    <div class="w-full flex justify-center mb-4">
      <ErrorMessage message="You have some errors" />
    </div>
  {/if}
  <div class="questions pt-6 px-6">
    {#each questions as question (question.id)}
      <!-- {#key question.id} -->
      <QuestionContainer
        onClose={onInitDeleteClicked(question.id)}
        scrollToQuestion={shouldScrollToLast(question.id, $questionnaire.questions)}
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
                question.is_dirty = true;
              }}
            />
          </div>

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
            <TextArea bind:value={question.code} rows="2" placeholder="Write your code" />
            <IconButton value="write-code" onClick={() => handleCode(question.id, false)}>
              <TrashCanIcon size={24} class="carbon-icon dark:text-white" />
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
                    <TrashCanIcon size={24} class="carbon-icon dark:text-white" />
                  </IconButton>
                  <IconButton
                    value={option.id}
                    onClick={handleAnswerSelect(question.id, option.id)}
                    buttonClassName={option.is_correct && 'success'}
                  >
                    {#if option.is_correct}
                      <CheckmarkFilledIcon size={24} class="carbon-icon dark:text-white" />
                    {:else}
                      <CheckmarkOutlineIcon size={24} class="carbon-icon dark:text-white" />
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
                    <TrashCanIcon size={24} class="carbon-icon dark:text-white" />
                  </IconButton>
                  <IconButton
                    value={option.id}
                    onClick={handleAnswerSelect(question.id, option.id)}
                    buttonClassName={option.is_correct && 'success'}
                  >
                    {#if option.is_correct}
                      <CheckmarkFilledIcon size={24} class="carbon-icon dark:text-white" />
                    {:else}
                      <CheckmarkOutlineIcon size={24} class="carbon-icon dark:text-white" />
                    {/if}
                  </IconButton>
                </div>
              </Checkbox>
            {/each}
          {/if}

          {#if QUESTION_TYPE.TEXTAREA === question.question_type.id}
            <TextArea bind:value={question.value} disabled={true} />
          {/if}

          {#if getQuestionErrorMsg(errors, question, 'option')}
            <ErrorMessage message={getQuestionErrorMsg(errors, question, 'option')} />
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
              <AddFilledIcon size={24} class="carbon-icon dark:text-white" />
              <p class="dark:text-white ml-2">Add option</p>
            </PrimaryButton>
          </div>
        {/if}
      </QuestionContainer>

      <!--  {/key} -->
    {/each}
  </div>
</div>

<style>
  :global(#dnd-action-dragged-el div) {
    z-index: 100;
  }
</style>
