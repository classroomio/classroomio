<script lang="ts">
  import * as Dialog from '@cio/ui/base/dialog';
  import * as Select from '@cio/ui/base/select';
  import { Button } from '@cio/ui/base/button';
  import { Label } from '@cio/ui/base/label';
  import * as Field from '@cio/ui/base/field';
  import { RadioOptionCardGroup } from '@cio/ui/custom/radio-option-card';
  import { contentCreateStore, contentCreateStoreUtils } from './store';
  import { ContentType } from '@cio/utils/constants/content';
  import {
    calculateNextSectionOrder,
    calculateNextContentOrder,
    UNGROUPED_SECTION_KEY
  } from '@cio/utils/functions/course-content';
  import { courseApi } from '$features/course/api';
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import ExerciseCreateStepper from './exercise-create-stepper.svelte';
  import SectionCreateStepper from './section-create-stepper.svelte';
  import LessonCreateStepper from './lesson-create-stepper.svelte';
  import CourseContentIcon from '$features/course/components/course-content-icon.svelte';
  import { getContentRoute } from '$features/course/utils/content';
  import type { CreatedContent, LockedSection, StepperRef, StepperState } from './types';
  import { DEFAULT_STEPPER_STATE, CONTENT_OPTIONS, SUCCESS_SENTENCE_KEYS, REPEAT_LABEL_KEYS } from './constants';
  import { t } from '$lib/utils/functions/translations';
  import { tick, untrack, onDestroy } from 'svelte';
  import { CheckIcon } from '@lucide/svelte';

  type ModalPhase = 'form' | 'success';

  let step = $state(0);
  let phase = $state<ModalPhase>('form');
  let createdContent = $state<CreatedContent | null>(null);
  /** Modal-local section context for the section -> Add content handoff. */
  let lockedSection = $state<LockedSection | null>(null);
  /** Guards stale async creates when the modal closes or reopens mid-flight. */
  let modalSession = $state(0);
  let initialSelectedType = ContentType.Lesson;
  let selectedType = $state<ContentType>(initialSelectedType);
  let sectionId = $state('');
  let primarySuccessButton: HTMLButtonElement | null = $state(null);

  // ============================================
  // STEPPER COMPONENT REFERENCES
  // ============================================
  let sectionStepper: StepperRef | undefined = $state();
  let lessonStepper: StepperRef | undefined = $state();
  let exerciseStepper: StepperRef | undefined = $state();

  // ============================================
  // UNIFIED STEPPER STATE
  // ============================================
  const activeStepper = $derived(
    selectedType === ContentType.Section
      ? sectionStepper
      : selectedType === ContentType.Lesson
        ? lessonStepper
        : selectedType === ContentType.Exercise
          ? exerciseStepper
          : undefined
  );

  let sectionStepperState = $state<StepperState>({ ...DEFAULT_STEPPER_STATE });
  let lessonStepperState = $state<StepperState>({ ...DEFAULT_STEPPER_STATE });
  let exerciseStepperState = $state<StepperState>({ ...DEFAULT_STEPPER_STATE });

  const stepperState = $derived(
    selectedType === ContentType.Section
      ? sectionStepperState
      : selectedType === ContentType.Lesson
        ? lessonStepperState
        : selectedType === ContentType.Exercise
          ? exerciseStepperState
          : DEFAULT_STEPPER_STATE
  );

  const contentGroupingEnabled = $derived(courseApi.course?.metadata?.isContentGroupingEnabled ?? true);
  const sections = $derived(
    (courseApi.course?.content?.sections || []).filter((section) => section.id !== UNGROUPED_SECTION_KEY)
  );
  /**
   * True when section is locked by context: either opened from a specific section
   * in the sidebar (store sectionId), or continuing into a freshly created section (lockedSection).
   */
  const sectionFromContext = $derived(!!$contentCreateStore.sectionId || !!lockedSection);
  const visibleContentOptions = $derived(
    sectionFromContext || !contentGroupingEnabled
      ? CONTENT_OPTIONS.filter((option) => option.type !== ContentType.Section)
      : CONTENT_OPTIONS
  );
  const contentOptionsForGroup = $derived(
    visibleContentOptions.map((o) => ({
      id: o.id,
      title: $t(o.titleKey),
      description: $t(o.descriptionKey),
      value: o.type
    }))
  );
  const requiresSection = $derived(contentGroupingEnabled && selectedType !== ContentType.Section);
  const hasSections = $derived(sections.length > 0 || !!lockedSection);
  const canCreateLessonOrExercise = $derived(!requiresSection || (requiresSection && !!sectionId));
  const successSentenceKey = $derived(createdContent ? SUCCESS_SENTENCE_KEYS[createdContent.type] : '');
  const repeatLabelKey = $derived(createdContent ? REPEAT_LABEL_KEYS[createdContent.type] : '');
  const isSectionSuccess = $derived(createdContent?.type === ContentType.Section);
  const primarySuccessLabel = $derived(
    isSectionSuccess
      ? $t('course.navItem.lessons.add_content_add_to_section')
      : $t('course.navItem.lessons.add_content_open_now')
  );

  const courseId = $derived(courseApi.course?.id || '');
  const effectiveSectionId = $derived(requiresSection ? sectionId : undefined);
  /** Local reserved orders for sections created in this modal session while refreshCourse is pending */
  let reservedSectionOrders = $state<number[]>([]);
  /** Local reserved orders for lessons/exercises created in this modal session (keyed by sectionId or UNGROUPED_SECTION_KEY) */
  let reservedContentOrders = $state<Record<string, number[]>>({});

  const nextContentOrder = $derived(getNextContentOrder(effectiveSectionId));

  function getNextSectionOrder() {
    return calculateNextSectionOrder(sections, reservedSectionOrders);
  }

  function getContentReservationKey(targetSectionId?: string) {
    return targetSectionId ?? UNGROUPED_SECTION_KEY;
  }

  function getNextContentOrder(targetSectionId?: string) {
    const key = getContentReservationKey(targetSectionId);
    return calculateNextContentOrder(courseApi.course?.content, targetSectionId, reservedContentOrders[key]);
  }

  function resetModalState() {
    phase = 'form';
    createdContent = null;
    lockedSection = null;
    reservedSectionOrders = [];
    reservedContentOrders = {};
  }

  function resetStepperStates() {
    sectionStepperState = { ...DEFAULT_STEPPER_STATE };
    lessonStepperState = { ...DEFAULT_STEPPER_STATE };
    exerciseStepperState = { ...DEFAULT_STEPPER_STATE };
  }

  function resetAllSteppers() {
    sectionStepper?.actions.reset();
    lessonStepper?.actions.reset();
    exerciseStepper?.actions.reset();
    resetStepperStates();
  }

  let closeResetTimeout: ReturnType<typeof setTimeout> | null = null;

  $effect(() => {
    if ($contentCreateStore.open) {
      if (closeResetTimeout) {
        clearTimeout(closeResetTimeout);
        closeResetTimeout = null;
      }
      untrack(() => {
        modalSession += 1;
        resetModalState();
        step = $contentCreateStore.skipTypeSelection ? 1 : 0;
        const initialType = $contentCreateStore.initialType ?? ContentType.Lesson;
        selectedType = contentGroupingEnabled || initialType !== ContentType.Section ? initialType : ContentType.Lesson;
        const storeSectionId = $contentCreateStore.sectionId;
        sectionId = storeSectionId || (contentGroupingEnabled ? sections[0]?.id || '' : '');

        resetAllSteppers();
      });
    }
  });

  function resetFormState() {
    phase = 'form';
    createdContent = null;
    step = 1;
    resetStepperStates();
  }

  function closeModal() {
    // Invalidate any in-flight create so a late success is discarded.
    modalSession += 1;
    contentCreateStoreUtils.close();

    // Defer resetting content/phase until after the dialog's exit animation
    // completes to avoid flickering the underlying form/stepper while fading out.
    if (closeResetTimeout) clearTimeout(closeResetTimeout);
    closeResetTimeout = setTimeout(() => {
      if (!$contentCreateStore.open) {
        resetModalState();
      }
    }, 250);
  }

  onDestroy(() => {
    if (closeResetTimeout) {
      clearTimeout(closeResetTimeout);
      closeResetTimeout = null;
    }
  });

  function handleCreated(content: CreatedContent, startedSession?: number) {
    if (!$contentCreateStore.open) return;
    if (startedSession !== undefined && startedSession !== modalSession) return;

    const currentSession = modalSession;
    const nextCreatedContent = { ...content };
    createdContent = nextCreatedContent;
    phase = 'success';

    // Reserve the created order so consecutive "Create another" actions generate distinct orders
    if (content.type === ContentType.Section) {
      const allocatedOrder = content.order ?? getNextSectionOrder();
      reservedSectionOrders = [...reservedSectionOrders, allocatedOrder];
    } else {
      const key = getContentReservationKey(effectiveSectionId);
      const allocatedOrder = content.order ?? nextContentOrder;
      reservedContentOrders = {
        ...reservedContentOrders,
        [key]: [...(reservedContentOrders[key] ?? []), allocatedOrder]
      };
    }

    return tick().then(() => {
      if (!$contentCreateStore.open || currentSession !== modalSession) return;

      primarySuccessButton?.focus();
    });
  }

  function goToDetails() {
    step = 1;
  }

  function goBack() {
    step = 0;
  }

  // ============================================
  // UNIFIED NAVIGATION HANDLERS
  // ============================================
  function handleUnifiedBack() {
    if (stepperState.currentStep > 0) {
      activeStepper?.actions.back();
    } else {
      goBack();
    }
  }

  async function handleUnifiedNext() {
    await activeStepper?.actions.next();
  }

  function handleCreateAnother() {
    if (!createdContent) return;

    selectedType = createdContent.type;
    resetFormState();
    activeStepper?.actions.reset();
    step = 1;
  }

  function handleLater() {
    closeModal();
  }

  function handlePrimarySuccess() {
    if (!createdContent) return;

    const successContent = { ...createdContent };

    if (successContent.type === ContentType.Section) {
      const nextLockedSection = { id: successContent.id, title: successContent.title };
      lockedSection = nextLockedSection;
      selectedType = initialSelectedType;
      sectionId = nextLockedSection.id;
      resetFormState();
      lessonStepper?.actions.reset();
      step = 0;
      return;
    }

    const route = courseId ? getContentRoute(courseId, successContent) : '';
    if (!route) return;

    closeModal();
    goto(resolve(route, {})).catch((error) => {
      console.error('Failed to navigate to created content:', error);
    });
  }
</script>

<Dialog.Root bind:open={$contentCreateStore.open} onOpenChange={(isOpen) => !isOpen && closeModal()}>
  <Dialog.Content
    class="flex max-h-[calc(100dvh-3rem)] w-[calc(100%-3rem)] max-w-[calc(100%-3rem)] flex-col overflow-hidden p-6 sm:max-h-170 sm:w-full sm:max-w-xl"
  >
    <Dialog.Header>
      <Dialog.Title>{$t('course.navItem.lessons.add_content')}</Dialog.Title>
    </Dialog.Header>

    <div role="status" aria-live="polite" class="ui:sr-only">
      {phase === 'success' && successSentenceKey ? $t(successSentenceKey) : ''}
    </div>

    <div class="min-h-0 flex-1 overflow-x-hidden overflow-y-auto pr-1">
      {#if phase === 'success' && createdContent}
        <div class="ui:border-border rounded-lg border p-[20px_16px]" style="background: var(--sidebar);">
          <div class="mb-3 flex min-w-0 items-center gap-3">
            <div
              class="relative grid shrink-0 place-items-center rounded-lg"
              style="width: 36px; height: 36px; background: color-mix(in oklch, var(--primary) 12%, white); color: var(--primary);"
            >
              <CourseContentIcon type={createdContent.type} size={18} />
              <span
                class="absolute grid place-items-center rounded-full pt-[1.5px] text-white"
                style="right: -4px; bottom: -4px; width: 18px; height: 18px; background: var(--success); border: 2px solid var(--background);"
              >
                <CheckIcon size={12} class="custom" />
              </span>
            </div>
            <p class="min-w-0 truncate text-[15px] font-[650]" style="margin: 0;" title={createdContent.title}>
              {createdContent.title}
            </p>
          </div>
          <p
            class="flex items-center gap-2 text-sm font-semibold"
            style="color: var(--success); margin: 0;"
            aria-hidden="true"
          >
            <CheckIcon size={16} class="custom shrink-0" />
            {$t(successSentenceKey)}
          </p>
        </div>
        <Dialog.Footer class="mt-6 flex flex-row flex-wrap items-center justify-between gap-2.5 sm:justify-between">
          <Button
            variant="ghost-default"
            class="ui:border ui:border-primary ui:bg-background"
            onclick={handleCreateAnother}
          >
            {$t(repeatLabelKey)}
          </Button>
          <div class="flex items-center gap-2">
            <Button variant="secondary" onclick={handleLater}>
              {$t('course.navItem.lessons.add_content_later')}
            </Button>
            <Button bind:ref={primarySuccessButton} onclick={handlePrimarySuccess}>
              {primarySuccessLabel}
            </Button>
          </div>
        </Dialog.Footer>
      {:else if step === 0}
        <!-- Select a content type - Section | Lesson | Exercise -->
        <div class="flex flex-col gap-3">
          <Field.Description>{$t('course.navItem.lessons.add_content_description')}</Field.Description>
          <RadioOptionCardGroup
            options={contentOptionsForGroup}
            bind:value={selectedType}
            class={contentOptionsForGroup.length >= 3 ? 'md:grid-cols-3' : 'md:grid-cols-2'}
          />
          <Dialog.Footer>
            <Button onclick={goToDetails}>{$t('course.navItem.lessons.add_content_continue')}</Button>
          </Dialog.Footer>
        </div>
      {:else}
        <!-- Create content - Section | Lesson | Exercise -->
        <div class="px-1">
          {#if requiresSection}
            <div class="mb-4">
              <Label class="text-md mb-1 font-bold">{$t('course.navItem.lessons.add_content_section_label')}</Label>
              {#if sectionFromContext}
                <p class="ui:text-muted-foreground text-sm wrap-break-word">
                  {$t('course.navItem.lessons.add_content_adding_to')}
                  <strong>
                    {lockedSection?.title ??
                      sections.find((s) => s.id === sectionId)?.title ??
                      $t('course.navItem.lessons.add_content_section_fallback')}
                  </strong>
                </p>
              {:else if hasSections}
                <Select.Root
                  type="single"
                  value={sectionId}
                  onValueChange={(value) => {
                    if (value) sectionId = value;
                  }}
                >
                  <Select.Trigger class="h-10 w-full max-w-full">
                    {sections.find((s) => s.id === sectionId)?.title ||
                      $t('course.navItem.lessons.add_content_select_section')}
                  </Select.Trigger>
                  <Select.Content>
                    <Select.Group>
                      {#each sections as section (section.id)}
                        <Select.Item value={section.id}>{section.title}</Select.Item>
                      {/each}
                    </Select.Group>
                  </Select.Content>
                </Select.Root>
              {:else}
                <p class="text-xs text-gray-500">{$t('course.navItem.lessons.add_content_create_section_first')}</p>
              {/if}
            </div>
          {/if}

          {#if selectedType === ContentType.Section}
            <SectionCreateStepper
              bind:this={sectionStepper}
              bind:stepperState={sectionStepperState}
              {courseId}
              order={getNextSectionOrder()}
              canCreate={true}
              sections={sections.map((s) => ({ id: s.id, order: s.order ?? undefined }))}
              session={modalSession}
              onCreated={handleCreated}
            />
          {:else if selectedType === ContentType.Lesson}
            <LessonCreateStepper
              bind:this={lessonStepper}
              bind:stepperState={lessonStepperState}
              {courseId}
              sectionId={effectiveSectionId}
              order={nextContentOrder}
              canCreate={canCreateLessonOrExercise}
              session={modalSession}
              onCreated={handleCreated}
            />
          {:else if selectedType === ContentType.Exercise}
            <ExerciseCreateStepper
              bind:this={exerciseStepper}
              bind:stepperState={exerciseStepperState}
              {courseId}
              sectionId={effectiveSectionId}
              order={nextContentOrder}
              canCreate={canCreateLessonOrExercise}
              session={modalSession}
              onCreated={handleCreated}
            />
          {/if}

          <Dialog.Footer class="mt-6 flex flex-row flex-wrap items-center justify-between gap-2 sm:justify-between">
            <Button variant="outline" onclick={handleUnifiedBack}
              >{$t('course.navItem.lessons.add_content_back')}</Button
            >
            <Button onclick={handleUnifiedNext} loading={stepperState.isSubmitting} disabled={!stepperState.canProceed}>
              {stepperState.primaryActionLabel}
            </Button>
          </Dialog.Footer>
        </div>
      {/if}
    </div>
  </Dialog.Content>
</Dialog.Root>
