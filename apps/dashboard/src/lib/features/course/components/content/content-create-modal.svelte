<script lang="ts">
  import * as Dialog from '@cio/ui/base/dialog';
  import * as Select from '@cio/ui/base/select';
  import { Button } from '@cio/ui/base/button';
  import { Label } from '@cio/ui/base/label';
  import * as Field from '@cio/ui/base/field';
  import { RadioOptionCardGroup } from '@cio/ui/custom/radio-option-card';
  import { contentCreateStore, contentCreateStoreUtils } from './store';
  import { ContentType } from '@cio/utils/constants/content';
  import { courseApi } from '$features/course/api';
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import ExerciseCreateStepper from './exercise-create-stepper.svelte';
  import SectionCreateStepper from './section-create-stepper.svelte';
  import LessonCreateStepper from './lesson-create-stepper.svelte';
  import type { StepperRef, StepperState } from './types';
  import { DEFAULT_STEPPER_STATE, CONTENT_OPTIONS } from './constants';
  import { t } from '$lib/utils/functions/translations';
  import { untrack } from 'svelte';

  let step = $state(0);
  let selectedType = $state<ContentType>(ContentType.Lesson);
  let sectionId = $state('');

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
    (courseApi.course?.content?.sections || []).filter((section) => section.id !== 'ungrouped')
  );
  const visibleContentOptions = $derived(
    $contentCreateStore.sectionId
      ? CONTENT_OPTIONS.filter((option) => option.type !== ContentType.Section)
      : contentGroupingEnabled
        ? CONTENT_OPTIONS
        : CONTENT_OPTIONS.filter((option) => option.type !== ContentType.Section)
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
  const hasSections = $derived(sections.length > 0);
  /** True when modal was opened from a section (e.g. plus icon in sidebar), so we use store sectionId */
  const sectionFromContext = $derived(!!$contentCreateStore.sectionId);
  const canCreateLessonOrExercise = $derived(!requiresSection || (requiresSection && !!sectionId));

  function getNextSectionOrder() {
    const orders = sections.map((section, index) => section.order ?? index + 1);
    const maxOrder = orders.length ? Math.max(...orders) : 0;
    return maxOrder + 1;
  }

  function getNextContentOrder(targetSectionId?: string) {
    const content = courseApi.course?.content;
    if (!content) return 1;

    let items = content.items;

    if (content.grouped) {
      const section = targetSectionId
        ? content.sections.find((entry) => entry.id === targetSectionId)
        : content.sections.find((entry) => entry.id === 'ungrouped');
      items = section?.items ?? [];
    }

    const orders = items.map((item, index) => item.order ?? index + 1);
    const maxOrder = orders.length ? Math.max(...orders) : 0;

    return maxOrder + 1;
  }

  $effect(() => {
    if ($contentCreateStore.open) {
      untrack(() => {
        step = $contentCreateStore.skipTypeSelection ? 1 : 0;
        const initialType = $contentCreateStore.initialType ?? ContentType.Lesson;
        selectedType = contentGroupingEnabled || initialType !== ContentType.Section ? initialType : ContentType.Lesson;
        sectionId = contentGroupingEnabled
          ? $contentCreateStore.sectionId || sections[0]?.id || ''
          : $contentCreateStore.sectionId || '';

        sectionStepper?.actions.reset();
        lessonStepper?.actions.reset();
        exerciseStepper?.actions.reset();
        sectionStepperState = { ...DEFAULT_STEPPER_STATE };
        lessonStepperState = { ...DEFAULT_STEPPER_STATE };
        exerciseStepperState = { ...DEFAULT_STEPPER_STATE };
      });
    }
  });

  function closeModal() {
    contentCreateStoreUtils.close();
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
</script>

<Dialog.Root bind:open={$contentCreateStore.open} onOpenChange={(isOpen) => !isOpen && closeModal()}>
  <Dialog.Content class="flex max-h-[680px] w-fit! max-w-2xl! min-w-[400px] flex-col overflow-hidden">
    <Dialog.Header>
      <Dialog.Title>{$t('course.navItem.lessons.add_content')}</Dialog.Title>
    </Dialog.Header>

    <div class="min-h-0 flex-1 overflow-y-auto pr-1">
      {#if step === 0}
        <!-- Select a content type - Section | Lesson | Exercise -->
        <div class="flex flex-col gap-3">
          <Field.Description>{$t('course.navItem.lessons.add_content_description')}</Field.Description>
          <RadioOptionCardGroup options={contentOptionsForGroup} bind:value={selectedType} class="md:grid-cols-3" />
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
                <p class="text-muted-foreground text-sm">
                  {$t('course.navItem.lessons.add_content_adding_to')}
                  <strong>
                    {sections.find((s) => s.id === sectionId)?.title ??
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
                  <Select.Trigger class="h-10 w-full">
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
              courseId={courseApi.course?.id || ''}
              order={getNextSectionOrder()}
              canCreate={true}
              sections={sections.map((s) => ({ id: s.id, order: s.order ?? undefined }))}
              onCreated={() => closeModal()}
            />
          {:else if selectedType === ContentType.Lesson}
            <LessonCreateStepper
              bind:this={lessonStepper}
              bind:stepperState={lessonStepperState}
              courseId={courseApi.course?.id || ''}
              sectionId={requiresSection ? sectionId : undefined}
              order={getNextContentOrder(requiresSection ? sectionId : undefined)}
              canCreate={canCreateLessonOrExercise}
              onCreated={(lessonId) => {
                closeModal();
                goto(resolve(`/courses/${courseApi.course?.id}/lessons/${lessonId}`, {}));
              }}
            />
          {:else if selectedType === ContentType.Exercise}
            <ExerciseCreateStepper
              bind:this={exerciseStepper}
              bind:stepperState={exerciseStepperState}
              courseId={courseApi.course?.id || ''}
              sectionId={requiresSection ? sectionId : undefined}
              order={getNextContentOrder(requiresSection ? sectionId : undefined)}
              canCreate={canCreateLessonOrExercise}
              onCreated={(exerciseId) => {
                closeModal();
                goto(resolve(`/courses/${courseApi.course?.id}/exercises/${exerciseId}`, {}));
              }}
            />
          {/if}

          <Dialog.Footer class="mt-6 flex items-center justify-between">
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
