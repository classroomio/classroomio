<script lang="ts">
  import * as Select from '@cio/ui/base/select';
  import TrashIcon from '@lucide/svelte/icons/trash';

  import {
    questionnaire,
    deleteConfirmation,
    questionnaireValidation,
    handleRemoveQuestion,
    handleCode
  } from './store';
  import { preventDefault } from '$lib/utils/functions/svelte';
  import { exerciseApi } from '$features/course/api';
  import { courseApi } from '$features/course/api';
  import { ContentType } from '@cio/utils/constants/content';
  import { PREMIUM_QUESTION_TYPE_KEYS, QUESTION_TYPES } from '$features/ui/question/constants';
  import { Button } from '@cio/ui/base/button';
  import { ExerciseQuestion } from '@cio/ui';

  import OrderModal from './order-modal.svelte';
  import { t } from '$lib/utils/functions/translations';
  import * as Dialog from '@cio/ui/base/dialog';
  import { IconButton } from '@cio/ui/custom/icon-button';
  import { TextareaField } from '@cio/ui/custom/textarea-field';
  import DeleteConfirmationModal from './delete-confirmation.svelte';
  import { QuestionContainer } from '$features/course/components';
  import { uploadImage } from '$lib/utils/services/upload';
  import {
    getQuestionTypeOptionById,
    questionTypeSupportsOptions,
    toExerciseQuestionModel
  } from './question-type-utils';
  import { QUESTION_TYPE_KEY } from '@cio/question-types';
  import { getExerciseQuestionLabels } from './question-labels';
  import { isFreePlan } from '$lib/utils/store/org';
  import { openUpgradeModal } from '$lib/utils/functions/org';
  import { PremiumIcon } from '@cio/ui/custom/moving-icons';

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
  const questionLabels = $derived(getExerciseQuestionLabels());

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

  function getQuestionTypeLabel(questionType) {
    if (!questionType) return t.get('course.navItem.lessons.exercises.all_exercises.edit_mode.select_type');
    if (questionType.labelKey) return t.get(questionType.labelKey);
    return questionType.label;
  }

  function makeDefaultOption() {
    return {
      id: `${new Date().getTime()}-form`,
      label: '',
      value: '',
      isCorrect: false
    };
  }

  function makeTrueFalseOptions(correctValue = true) {
    const ts = Date.now();
    return [
      { id: `${ts}-true-form`, label: 'True', value: 'true', isCorrect: correctValue },
      { id: `${ts}-false-form`, label: 'False', value: 'false', isCorrect: !correctValue }
    ];
  }

  function onQuestionTypeChange(questionId: string | number, value: string) {
    if (!value) return;

    const nextQuestionType = getQuestionTypeOptionById(Number(value));
    const nextQuestionTypeKey = nextQuestionType.key;

    questionnaire.update((q) => {
      const idx = q.questions.findIndex((qu) => String(qu.id) === String(questionId));
      if (idx === -1) return q;

      const current = q.questions[idx];
      let nextOptions = current.options ?? [];

      if (nextQuestionTypeKey === QUESTION_TYPE_KEY.TRUE_FALSE) {
        const correctValue = (current.settings as { correctValue?: boolean })?.correctValue ?? true;
        nextOptions = makeTrueFalseOptions(correctValue);
      } else if (questionTypeSupportsOptions(nextQuestionTypeKey)) {
        const hasActiveOptions = nextOptions.some((option) => !option.deletedAt);
        if (!hasActiveOptions) {
          nextOptions = [...nextOptions, makeDefaultOption()];
        }
      } else {
        nextOptions = [];
      }

      const next = [...q.questions];
      next[idx] = {
        ...current,
        questionType: nextQuestionType,
        questionTypeId: nextQuestionType.id,
        options: nextOptions,
        isDirty: true
      };

      return { ...q, questions: next };
    });
  }

  function onSharedQuestionChange(questionId: string | number, nextQuestion) {
    questionnaire.update((q) => {
      const idx = q.questions.findIndex((qu) => String(qu.id) === String(questionId));
      if (idx === -1) return q;

      const current = q.questions[idx];
      const mappedOptions = Array.isArray(nextQuestion.options)
        ? nextQuestion.options.map((option, index) => {
            const optionId = option.id ?? current.options?.[index]?.id ?? `${new Date().getTime()}-${index}-form`;
            const optionLabel = option.label ?? '';

            return {
              id: optionId,
              label: optionLabel,
              value: option.value ?? optionLabel,
              isCorrect: option.isCorrect ?? false,
              settings:
                option.settings && typeof option.settings === 'object' && !Array.isArray(option.settings)
                  ? { ...option.settings }
                  : undefined
            };
          })
        : (current.options ?? []);

      const next = [...q.questions];
      next[idx] = {
        ...current,
        title: nextQuestion.title,
        settings: nextQuestion.settings ?? {},
        options: mappedOptions,
        isDirty: true
      };

      return { ...q, questions: next };
    });
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

<div class="mb-20 w-full">
  {#if Object.values(errors).length}
    <div class="mb-4 flex w-full justify-center">
      <p class="text-sm text-red-500">{$t('course.navItem.lessons.exercises.all_exercises.edit_mode.error')}</p>
    </div>
  {/if}
  <div class="questions px-6 pt-6">
    {#each $questionnaire.questions as question, index (question.id)}
      {#if !question.deletedAt}
        <QuestionContainer
          key={String(question.id ?? `new-${index}`)}
          onClose={onInitDeleteClicked(question.id)}
          scrollToQuestion={shouldScrollToLast(question.id, $questionnaire.questions)}
          bind:points={question.points}
          hasError={!!errors[question.id]}
          errorMsg={getQuestionErrorMsg(errors, question, 'points')}
          onPointsChange={() => {
            question.isDirty = true;
          }}
        >
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
            <ExerciseQuestion.QuestionRenderer
              showContainer={false}
              contract={{
                mode: 'edit',
                question: toExerciseQuestionModel(question),
                labels: questionLabels,
                onImageUpload: uploadImage
              }}
              onQuestionChange={(nextQuestion) => onSharedQuestionChange(question.id, nextQuestion)}
            >
              {#snippet questionTypeSelect()}
                <Select.Root
                  type="single"
                  value={question.questionTypeId?.toString()}
                  onValueChange={(value) => onQuestionTypeChange(question.id, value)}
                >
                  <Select.Trigger class="w-[180px]">
                    {getQuestionTypeLabel(question?.questionType)}
                  </Select.Trigger>
                  <Select.Content>
                    {#each QUESTION_TYPES as type, i (type.key)}
                      {#if $isFreePlan && PREMIUM_QUESTION_TYPE_KEYS.has(type.key)}
                        <button
                          type="button"
                          class="ui:flex ui:w-full ui:cursor-pointer ui:select-none ui:items-center ui:gap-2 ui:rounded-sm ui:py-1.5 ui:pl-2 ui:pr-8 ui:text-sm ui:outline-hidden ui:hover:bg-accent ui:hover:text-accent-foreground ui:relative"
                          onclick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            openUpgradeModal();
                          }}
                          title={$t('course.navItem.lessons.exercises.all_exercises.edit_mode.premium_question_type')}
                        >
                          <PremiumIcon size={16} class="ui:text-blue-700 ui:dark:text-white ui:shrink-0" />
                          <span>{getQuestionTypeLabel(type)}</span>
                        </button>
                      {:else}
                        <Select.Item value={type.id.toString()} label={getQuestionTypeLabel(type)} />
                      {/if}
                    {/each}
                  </Select.Content>
                </Select.Root>
              {/snippet}
            </ExerciseQuestion.QuestionRenderer>

            {#if getQuestionErrorMsg(errors, question, 'option')}
              <p class="text-sm text-red-500">{getQuestionErrorMsg(errors, question, 'option')}</p>
            {/if}
          </div>
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
