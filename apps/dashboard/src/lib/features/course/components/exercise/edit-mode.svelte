<script lang="ts">
  import TrashIcon from '@lucide/svelte/icons/trash';
  import GripVerticalIcon from '@lucide/svelte/icons/grip-vertical';
  import { dndzone } from 'svelte-dnd-action';
  import { flip } from 'svelte/animate';
  import { tick } from 'svelte';

  import {
    questionnaire,
    deleteConfirmation,
    questionnaireValidation,
    handleRemoveQuestion,
    handleCode,
    handleAddQuestion,
    handleRemoveSection,
    handleReorderSections,
    handleReorderQuestionsInSection,
    handleUpdateSectionAfterBehavior,
    handleUpdateSectionColorTheme,
    handleUpdateSectionDescription,
    handleUpdateSectionTitle,
    hasSections,
    getQuestionsForSection
  } from './store';
  import { QUESTION_TYPES } from '$features/ui/question/constants';
  import { ExerciseQuestion } from '@cio/ui';

  import OrderModal from './order-modal.svelte';
  import QuestionTypeSelect from './question-type-select.svelte';
  import { t } from '$lib/utils/functions/translations';
  import { IconButton } from '@cio/ui/custom/icon-button';
  import { TextareaField } from '@cio/ui/custom/textarea-field';
  import DeleteConfirmationModal from './delete-confirmation.svelte';
  import { QuestionContainer } from '$features/course/components';
  import { uploadImage } from '$lib/utils/services/upload';
  import {
    getExerciseEditorQuestionTypeLabel,
    getQuestionTypeOptionById,
    questionTypeSupportsOptions,
    toExerciseQuestionModel
  } from './question-type-utils';
  import { QUESTION_TYPE_KEY } from '@cio/question-types';
  import { getExerciseQuestionLabels } from './question-labels';
  import SectionEditor from './section-editor.svelte';
  import type { Question } from '$features/course/types';
  import type { ExerciseEditorErrors } from './store';

  const flipDurationMs = 200;
  const initialQuestionsLength = $questionnaire.questions.length;
  type QuestionDndEvent = CustomEvent<{ items: Question[] }>;

  interface Props {
    shouldDeleteExercise?: boolean;
    exerciseId: string;
    goBack?: () => void;
    /** Self-paced + all auto-gradable question types: enforce points &gt; 0 */
    requiresPositivePointsForAutoGrade?: boolean;
    selfPacedCourse?: boolean;
    /** Public course restricts picker to auto-gradable question types only. */
    isPublicCourse?: boolean;
    reorderQuestions?: boolean;
  }

  let {
    shouldDeleteExercise = $bindable(false),
    exerciseId: _exerciseId,
    goBack: _goBack = () => {},
    requiresPositivePointsForAutoGrade = false,
    selfPacedCourse = false,
    isPublicCourse = false,
    reorderQuestions = false
  }: Props = $props();

  const availableQuestionTypes = $derived(
    isPublicCourse ? QUESTION_TYPES.filter((type) => type.autoGradable) : QUESTION_TYPES
  );

  let questionIdToDelete = $state(null);
  let sectionIdToDelete = $state<string | null>(null);
  let deleteConfirmationType = $state<'question' | 'section'>('question');
  let reorderQuestionItemsBySectionId = $state<Record<string, Question[]>>({});
  let previousReorderQuestions = $state(false);
  let errors = $derived($questionnaireValidation);
  const questionLabels = $derived(getExerciseQuestionLabels());
  const activeSections = $derived(
    [...($questionnaire.sections ?? [])].filter((section) => !section.deletedAt).sort((a, b) => a.order - b.order)
  );
  const sectionLabels = $derived({
    questions: t.get('course.navItem.lessons.exercises.all_exercises.section.questions'),
    shortQuestions: t.get('course.navItem.lessons.exercises.all_exercises.section.short_questions'),
    required: t.get('course.navItem.lessons.exercises.all_exercises.section.required'),
    addQuestion: t.get('course.navItem.lessons.exercises.all_exercises.section.add_question'),
    delete: t.get('course.navItem.lessons.exercises.all_exercises.section.delete'),
    moveUp: t.get('course.navItem.lessons.exercises.all_exercises.section.move_up'),
    moveDown: t.get('course.navItem.lessons.exercises.all_exercises.section.move_down'),
    color: t.get('course.navItem.lessons.exercises.all_exercises.section.color'),
    descriptionPlaceholder: t.get('course.navItem.lessons.exercises.all_exercises.section.description_placeholder')
  });
  const sectionAfterBehaviorLabels = $derived({
    afterSectionPrefix: t.get('course.navItem.lessons.exercises.all_exercises.section.after_section'),
    continue: t.get('course.navItem.lessons.exercises.all_exercises.section.continue'),
    goToSection: t.get('course.navItem.lessons.exercises.all_exercises.section.go_to_section'),
    submit: t.get('course.navItem.lessons.exercises.all_exercises.section.submit')
  });

  function shouldScrollToLast(questionId, questions) {
    const [lastQuestion] = questions.slice(-1);
    const currentQuestionsLength = questions.length;
    const isLast = lastQuestion.id === questionId;

    return isLast && initialQuestionsLength !== currentQuestionsLength;
  }

  async function scrollToExerciseElement(elementId: string) {
    await tick();
    requestAnimationFrame(() => {
      document.getElementById(elementId)?.scrollIntoView({
        block: 'start',
        behavior: 'smooth',
        inline: 'nearest'
      });
    });
  }

  function getQuestionElementId(questionId: string | number) {
    return `exercise-question-${questionId}`;
  }

  async function addQuestionToSection(sectionId: string) {
    const questionId = handleAddQuestion(sectionId);
    await scrollToExerciseElement(getQuestionElementId(questionId));
  }

  function onInitDeleteClicked(questionId) {
    return () => {
      deleteConfirmationType = 'question';
      questionIdToDelete = questionId;
      $deleteConfirmation.open = true;
    };
  }

  function onFinalDeleteClicked() {
    if (deleteConfirmationType === 'section' && sectionIdToDelete) {
      deleteSection(sectionIdToDelete);
      sectionIdToDelete = null;
      deleteConfirmationType = 'question';
      return;
    }

    handleRemoveQuestion(questionIdToDelete)();
    questionIdToDelete = null;
  }

  function onCancelDeleteClicked() {
    questionIdToDelete = null;
    sectionIdToDelete = null;
    deleteConfirmationType = 'question';
  }

  function getQuestionErrorMsg(
    errors: ExerciseEditorErrors,
    question: Question,
    errorKey: 'option' | 'title' | 'points'
  ) {
    return errors[question.id] ? errors[question.id][errorKey] : null;
  }

  function getSectionErrorMsg(errors: ExerciseEditorErrors, sectionId: string, errorKey: 'title' | 'description') {
    return errors[sectionId]?.[errorKey];
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
      let nextSettings = current.settings ?? {};

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

      if (nextQuestionTypeKey === QUESTION_TYPE_KEY.VIDEO_RECORDING) {
        nextSettings = {
          ...nextSettings,
          maxDurationSeconds: 60,
          allowRetakes: true
        };
      }

      const next = [...q.questions];
      next[idx] = {
        ...current,
        questionType: nextQuestionType,
        questionTypeId: nextQuestionType.id,
        settings: nextSettings,
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

  function moveSection(sectionId: string, direction: -1 | 1) {
    const currentIndex = activeSections.findIndex((section) => section.id === sectionId);
    const targetIndex = currentIndex + direction;
    if (currentIndex < 0 || targetIndex < 0 || targetIndex >= activeSections.length) return;

    const orderedIds = activeSections.map((section) => section.id);
    const [sectionToMove] = orderedIds.splice(currentIndex, 1);
    orderedIds.splice(targetIndex, 0, sectionToMove);
    handleReorderSections(orderedIds);
  }

  function deleteSection(sectionId: string) {
    const sectionIndex = activeSections.findIndex((section) => section.id === sectionId);
    const nearestSection = activeSections[sectionIndex + 1] ?? activeSections[sectionIndex - 1];
    handleRemoveSection(sectionId, nearestSection?.id);
  }

  function onInitSectionDeleteClicked(sectionId: string) {
    deleteConfirmationType = 'section';
    sectionIdToDelete = sectionId;
    $deleteConfirmation.open = true;
  }

  function syncReorderQuestionItems() {
    reorderQuestionItemsBySectionId = Object.fromEntries(
      activeSections.map((section) => [section.id, getQuestionsForSection($questionnaire.questions, section.id)])
    );
  }

  function getReorderQuestionsForSection(sectionId: string, sectionQuestions: Question[]) {
    return reorderQuestionItemsBySectionId[sectionId] ?? sectionQuestions;
  }

  function handleSectionQuestionDndConsider(sectionId: string, event: QuestionDndEvent) {
    reorderQuestionItemsBySectionId = {
      ...reorderQuestionItemsBySectionId,
      [sectionId]: event.detail.items
    };
  }

  function handleSectionQuestionDndFinalize(sectionId: string, event: QuestionDndEvent) {
    reorderQuestionItemsBySectionId = {
      ...reorderQuestionItemsBySectionId,
      [sectionId]: event.detail.items
    };
    handleReorderQuestionsInSection(
      sectionId,
      event.detail.items.map((question) => question.id)
    );
  }

  function getRequiredQuestionCount(questions: Question[]) {
    return questions.filter((question) => toExerciseQuestionModel(question).required !== false).length;
  }

  $effect(() => {
    if (reorderQuestions && !previousReorderQuestions) {
      syncReorderQuestionItems();
    }

    if (!reorderQuestions && previousReorderQuestions) {
      reorderQuestionItemsBySectionId = {};
    }

    previousReorderQuestions = reorderQuestions;
  });
</script>

<DeleteConfirmationModal
  title={deleteConfirmationType === 'section'
    ? $t('course.navItem.lessons.exercises.all_exercises.delete_confirmation.section_title')
    : $t('course.navItem.lessons.exercises.all_exercises.delete_confirmation.title')}
  description={deleteConfirmationType === 'section'
    ? $t('course.navItem.lessons.exercises.all_exercises.delete_confirmation.section_sure')
    : $t('course.navItem.lessons.exercises.all_exercises.delete_confirmation.sure')}
  onCancel={onCancelDeleteClicked}
  onDelete={onFinalDeleteClicked}
/>

<OrderModal />

{#snippet questionEditor(question, index)}
  <QuestionContainer
    elementId={getQuestionElementId(question.id)}
    key={String(question.id ?? `new-${index}`)}
    onClose={onInitDeleteClicked(question.id)}
    scrollToQuestion={shouldScrollToLast(question.id, $questionnaire.questions)}
    bind:points={question.points}
    hasError={!!errors[question.id]}
    errorMsg={getQuestionErrorMsg(errors, question, 'points')}
    pointsHint={requiresPositivePointsForAutoGrade && Number(question.points) === 0
      ? $t('course.navItem.lessons.exercises.all_exercises.points_required_auto_grade')
      : null}
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
          <QuestionTypeSelect
            value={question.questionTypeId?.toString()}
            onValueChange={(nextValue) => onQuestionTypeChange(question.id, nextValue)}
            triggerQuestionType={question?.questionType}
            types={availableQuestionTypes}
            {selfPacedCourse}
          />
        {/snippet}
      </ExerciseQuestion.QuestionRenderer>

      {#if getQuestionErrorMsg(errors, question, 'option')}
        <p class="text-sm text-red-500">{getQuestionErrorMsg(errors, question, 'option')}</p>
      {/if}
    </div>
  </QuestionContainer>
{/snippet}

{#snippet compactQuestionRow(question, index)}
  <div class="border-border flex items-center gap-3 rounded-md border bg-white px-4 py-3 dark:bg-black">
    <span class="ui:text-muted-foreground w-6 text-sm font-medium tabular-nums">{index + 1}</span>
    <div class="min-w-0 flex-1">
      <p class="truncate text-sm font-semibold">
        {question.title || getExerciseEditorQuestionTypeLabel(question?.questionType)}
      </p>
      <p class="ui:text-muted-foreground text-xs">{getExerciseEditorQuestionTypeLabel(question?.questionType)}</p>
    </div>
  </div>
{/snippet}

<div class="mb-20 w-full">
  {#if Object.values(errors).length}
    <div class="mb-4 flex w-full justify-center">
      <p class="text-sm text-red-500">{$t('course.navItem.lessons.exercises.all_exercises.edit_mode.error')}</p>
    </div>
  {/if}
  <div class="questions px-6 pt-6">
    {#if hasSections($questionnaire.sections)}
      <div class="space-y-5">
        {#each activeSections as section, sectionIndex (section.id)}
          {@const sectionQuestions = getQuestionsForSection($questionnaire.questions, section.id)}
          {@const reorderSectionQuestions = getReorderQuestionsForSection(section.id, sectionQuestions)}
          <SectionEditor
            exerciseSectionId={section.id}
            title={section.title}
            description={section.description}
            sectionNumber={sectionIndex + 1}
            totalSections={activeSections.length}
            colorTheme={section.colorTheme}
            questionCount={sectionQuestions.length}
            requiredQuestionCount={getRequiredQuestionCount(sectionQuestions)}
            labels={sectionLabels}
            titleError={getSectionErrorMsg(errors, section.id, 'title')}
            descriptionError={getSectionErrorMsg(errors, section.id, 'description')}
            showReorderHandles={reorderQuestions}
            onTitleChange={(title) => handleUpdateSectionTitle(section.id, title)}
            onDescriptionChange={(description) => handleUpdateSectionDescription(section.id, description)}
            onColorThemeChange={(colorTheme) => handleUpdateSectionColorTheme(section.id, colorTheme)}
            onAddQuestion={() => addQuestionToSection(section.id)}
            onDelete={() => onInitSectionDeleteClicked(section.id)}
            onMoveUp={() => moveSection(section.id, -1)}
            onMoveDown={() => moveSection(section.id, 1)}
            canMoveUp={sectionIndex > 0}
            canMoveDown={sectionIndex < activeSections.length - 1}
          >
            <div
              class="space-y-2"
              use:dndzone={{
                items: reorderQuestions ? reorderSectionQuestions : sectionQuestions,
                flipDurationMs,
                dropTargetStyle: {
                  border: '2px #1d4ed8 solid',
                  'border-style': 'dashed',
                  'border-radius': '0.5rem'
                },
                dragDisabled: !reorderQuestions,
                type: `exercise-section-question-${section.id}`
              }}
              onconsider={(event) => handleSectionQuestionDndConsider(section.id, event)}
              onfinalize={(event) => handleSectionQuestionDndFinalize(section.id, event)}
            >
              {#each reorderQuestions ? reorderSectionQuestions : sectionQuestions as question, index (question.id)}
                <div
                  animate:flip={{ duration: flipDurationMs }}
                  class="flex items-start gap-3 transition {reorderQuestions
                    ? 'cursor-grab active:cursor-grabbing'
                    : ''}"
                >
                  <div class="ui:text-muted-foreground flex w-5 shrink-0 flex-col items-center gap-2 pt-3">
                    {#if reorderQuestions}
                      <GripVerticalIcon class="h-4 w-4 cursor-grab active:cursor-grabbing" aria-hidden="true" />
                    {/if}
                    <span class="text-xs font-medium tabular-nums">{index + 1}</span>
                  </div>
                  <div class="min-w-0 flex-1">
                    {#if reorderQuestions}
                      {@render compactQuestionRow(question, index)}
                    {:else}
                      {@render questionEditor(question, index)}
                    {/if}
                  </div>
                </div>
              {/each}
            </div>
          </SectionEditor>

          <ExerciseQuestion.SectionAfterBehavior
            {sectionIndex}
            currentSectionId={section.id}
            allSections={activeSections}
            afterBehavior={section.afterBehavior}
            labels={sectionAfterBehaviorLabels}
            onChange={(behavior) => handleUpdateSectionAfterBehavior(section.id, behavior)}
          />
        {/each}
      </div>
    {:else}
      {#each $questionnaire.questions as question, index (question.id)}
        {#if !question.deletedAt}
          {@render questionEditor(question, index)}
        {/if}
      {/each}
    {/if}
  </div>
</div>

<style>
  :global(#dnd-action-dragged-el div) {
    z-index: 100;
  }
</style>
