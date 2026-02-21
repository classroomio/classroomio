<script lang="ts">
  import * as Select from '@cio/ui/base/select';
  import TrashIcon from '@lucide/svelte/icons/trash';
  import CirclePlusIcon from '@lucide/svelte/icons/circle-plus';

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
  } from './store';
  import { preventDefault } from '$lib/utils/functions/svelte';
  import { exerciseApi } from '$features/course/api';
  import { courseApi } from '$features/course/api';
  import { QUESTION_TYPE } from '@cio/utils/validation/constants';
  import { ContentType } from '@cio/utils/constants/content';
  import { QUESTION_TYPES } from '$features/ui/question/constants';
  import { Button } from '@cio/ui/base/button';

  import OrderModal from './order-modal.svelte';
  import { t } from '$lib/utils/functions/translations';
  import * as Dialog from '@cio/ui/base/dialog';
  import { IconButton } from '@cio/ui/custom/icon-button';
  import { TextareaField } from '@cio/ui/custom/textarea-field';
  import { CheckboxField } from '@cio/ui/custom/checkbox-field';
  import { RadioItem } from '@cio/ui/custom/radio-item';
  import * as RadioGroup from '@cio/ui/base/radio-group';
  import { InputField } from '@cio/ui/custom/input-field';
  import DeleteConfirmationModal from './delete-confirmation.svelte';
  import { CircleCheckIcon } from '$features/ui/icons';
  import { QuestionContainer } from '$features/course/components';

  const initialQuestionsLength = $questionnaire.questions.length;

  interface Props {
    shouldDeleteExercise?: boolean;
    exerciseId: any;
    goBack?: any;
  }

  let { shouldDeleteExercise = $bindable(false), exerciseId, goBack = () => {} }: Props = $props();

  let questionIdToDelete = $state(null);
  let isDeleting = $state(false);
  let errors = $derived($questionnaireValidation);

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

  function getQuestionErrorMsg(errors, question, errorKey) {
    return errors[question.id] ? errors[question.id][errorKey] : null;
  }

  async function handleDelete() {
    isDeleting = true;

    await exerciseApi.delete(courseApi.course?.id!, exerciseId);

    if (exerciseApi.success) {
      courseApi.removeContentItem(exerciseId, ContentType.Exercise);
      goBack();
    }
    isDeleting = false;
  }
</script>

<DeleteConfirmationModal onCancel={() => (questionIdToDelete = null)} onDelete={onFinalDeleteClicked} />

<OrderModal />

<Dialog.Root
  bind:open={shouldDeleteExercise}
  onOpenChange={(isOpen) => {
    if (!isOpen) shouldDeleteExercise = false;
  }}
>
  <Dialog.Content class="w-2/4">
    <Dialog.Header>
      <Dialog.Title>{$t('course.navItem.lessons.exercises.all_exercises.edit_mode.delete_modal')}</Dialog.Title>
    </Dialog.Header>
    <form onsubmit={preventDefault()}>
      <h1 class="text-xl dark:text-white">
        {$t('course.navItem.lessons.exercises.all_exercises.edit_mode.sure')}
      </h1>

      <div class="mt-5 flex items-center justify-between">
        <Button variant="outline" type="submit" onclick={() => (shouldDeleteExercise = false)}>
          {$t('course.navItem.lessons.exercises.all_exercises.edit_mode.no')}
        </Button>
        <Button disabled={isDeleting} onclick={handleDelete} loading={isDeleting}>
          {isDeleting
            ? $t('course.navItem.lessons.exercises.all_exercises.edit_mode.deleting')
            : $t('course.navItem.lessons.exercises.all_exercises.edit_mode.yes')}
        </Button>
      </div>
    </form>
  </Dialog.Content>
</Dialog.Root>

{#snippet optionActions(question, option)}
  <div data-name="option-action" class="ml-2 flex items-center gap-2">
    <IconButton onclick={handleRemoveOption(question.id, option.id)}>
      <TrashIcon size={18} />
    </IconButton>
    <IconButton
      onclick={handleAnswerSelect(question.id, option.id)}
      class={option.isCorrect ? 'fill-green-500! text-green-500!' : ''}
    >
      <CircleCheckIcon size={18} filled={option.isCorrect} />
    </IconButton>
  </div>
{/snippet}

<div class="mb-20 w-full">
  {#if Object.values(errors).length}
    <div class="mb-4 flex w-full justify-center">
      <p class="text-sm text-red-500">{$t('course.navItem.lessons.exercises.all_exercises.edit_mode.error')}</p>
    </div>
  {/if}
  <div class="questions px-6 pt-6">
    {#each $questionnaire.questions as question, index}
      {#if !question.deletedAt}
        <QuestionContainer
          key={question.deletedAt}
          onClose={onInitDeleteClicked(question.id)}
          scrollToQuestion={shouldScrollToLast(question.id, $questionnaire.questions)}
          bind:points={question.points}
          hasError={!!errors[question.id]}
          errorMsg={getQuestionErrorMsg(errors, question, 'points')}
          onPointsChange={() => {
            question.isDirty = true;
          }}
        >
          <div class="flex items-center justify-between">
            <div class="mr-5 w-3/5">
              <InputField
                placeholder={$t('course.navItem.lessons.exercises.all_exercises.edit_mode.question')}
                bind:value={question.title}
                isRequired={true}
                onchange={() => {
                  question.isDirty = true;
                }}
              />
            </div>

            <Select.Root
              type="single"
              value={question.questionType.toString()}
              onValueChange={(value) => {
                if (!value) return;
                const id = parseInt(value);

                question.questionType = QUESTION_TYPES.find((q) => q.id === id) ?? QUESTION_TYPES[0];
                question.questionTypeId = question.questionType.id;
                question.isDirty = true;
              }}
            >
              <Select.Trigger class="w-[180px]">
                {question?.questionType?.label ? $t(question.questionType.label) : 'Select type'}
              </Select.Trigger>
              <Select.Content>
                {#each QUESTION_TYPES as type}
                  <Select.Item value={type.id.toString()} label={$t(type.label)} />
                {/each}
              </Select.Content>
            </Select.Root>
          </div>

          {#if typeof question.code === 'string'}
            <div class="my-3 flex w-3/5 items-center justify-between">
              <TextareaField
                bind:value={question.code}
                rows={2}
                placeholder={$t('course.navItem.lessons.exercises.all_exercises.edit_mode.write')}
              />
              <IconButton onclick={() => handleCode(question.id, false)}>
                <TrashIcon size={16} />
              </IconButton>
            </div>
          {/if}

          <div class="mt-2 flex flex-col">
            {#if QUESTION_TYPE.RADIO === question.questionType.id}
              <RadioGroup.Root value="" name={question.title || 'radio-name'}>
                {#each $questionnaire.questions[index]?.options || [] as option}
                  {#if !option.deletedAt}
                    <RadioItem
                      isEditable={true}
                      value={option.value || option.id?.toString() || ''}
                      bind:label={option.label}
                      onchange={addDynamicValue(question.id, option.id)}
                    >
                      {@render optionActions(question, option)}
                    </RadioItem>
                  {/if}
                {/each}
              </RadioGroup.Root>
            {:else if QUESTION_TYPE.CHECKBOX === question.questionType.id}
              <div class="flex flex-col gap-3">
                {#each $questionnaire.questions[index]?.options || [] as option}
                  {#if !option.deletedAt}
                    <CheckboxField
                      isEditable={true}
                      name={question?.name || 'checkbox-name'}
                      bind:label={option.label}
                      onchange={addDynamicValue(question.id, option.id)}
                    >
                      {@render optionActions(question, option)}
                    </CheckboxField>
                  {/if}
                {/each}
              </div>
            {/if}

            {#if QUESTION_TYPE.TEXTAREA === question.questionType.id}
              <TextareaField bind:value={question.value} disabled={true} />
            {/if}

            {#if getQuestionErrorMsg(errors, question, 'option')}
              <p class="text-sm text-red-500">{getQuestionErrorMsg(errors, question, 'option')}</p>
            {/if}
          </div>

          {#if QUESTION_TYPE.TEXTAREA !== question.questionType.id}
            <div class="mt-3 flex items-center">
              <Button variant="outline" onclick={handleAddOption(question.id)}>
                <CirclePlusIcon size={16} />
                {$t('course.navItem.lessons.exercises.all_exercises.edit_mode.option')}
              </Button>
            </div>
          {/if}
        </QuestionContainer>
      {/if}
    {/each}
  </div>
</div>

<style>
  :global(#dnd-action-dragged-el div) {
    z-index: 100;
  }
</style>
