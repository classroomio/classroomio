<script lang="ts">
  import { Badge } from '@cio/ui/base/badge';
  import { Skeleton } from '@cio/ui/base/skeleton';
  import { InputField } from '@cio/ui/custom/input-field';
  import { Label } from '@cio/ui/base/label';
  import * as RadioGroup from '@cio/ui/base/radio-group';
  import { RadioOptionCard } from '@cio/ui/custom/radio-option-card';
  import { t } from '$lib/utils/functions/translations';
  import { exerciseTemplateApi } from '$features/course/api/exercise-template.svelte';
  import { snackbar } from '$features/ui/snackbar/store';
  import { Confetti, ComingSoon } from '$features/ui';
  import { EXERCISE_TEMPLATE_TAGS } from '$features/course/utils/constants';
  import { exerciseApi } from '$features/course/api';
  import type { StepperState, StepperActions, BaseStepperProps } from './types';
  import { EXERCISE_STEPPER_DEFAULT_STATE, EXERCISE_CREATE_TYPE } from './constants';

  interface Props extends BaseStepperProps {
    stepperState: StepperState;
  }

  let {
    courseId,
    sectionId,
    order,
    onCreated,
    canCreate,
    stepperState = $bindable(EXERCISE_STEPPER_DEFAULT_STATE)
  }: Props = $props();

  const options = [
    {
      id: 'exercise-from-scratch',
      title: $t('course.navItem.lessons.exercises.new_exercise_modal.options.from_scratch'),
      description: $t('course.navItem.lessons.exercises.new_exercise_modal.options.from_scratch_subtitle'),
      type: EXERCISE_CREATE_TYPE.SCRATCH,
      isDisabled: false
    },
    {
      id: 'exercise-use-template',
      title: $t('course.navItem.lessons.exercises.new_exercise_modal.options.use_template'),
      description: $t('course.navItem.lessons.exercises.new_exercise_modal.options.use_template_subtitle'),
      type: EXERCISE_CREATE_TYPE.TEMPLATE,
      isDisabled: false
    },
    {
      id: 'exercise-ai',
      title: $t('course.navItem.lessons.exercises.new_exercise_modal.options.use_ai'),
      description: $t('course.navItem.lessons.exercises.new_exercise_modal.options.use_ai_subtitle'),
      type: EXERCISE_CREATE_TYPE.AI,
      isDisabled: true
    }
  ];

  const tags = Object.values(EXERCISE_TEMPLATE_TAGS);

  let step = $state(0);
  /** String for RadioGroup.Root (component expects string); numeric type derived for logic */
  let typeValue = $state(String(EXERCISE_CREATE_TYPE.SCRATCH));
  const type = $derived(Number(typeValue));
  let isLoading = $state(false);
  let isAIStarted = $state(false);
  let title = $state('');

  let selectedTag = $state(tags[0]);
  let selectedTemplateId = $state();
  let isTemplateFinishedLoading = $state(false);

  function handleNext() {
    step = step + 1;
  }

  function handleBack() {
    step = step - 1;
  }

  async function handleTemplateSelection() {
    if (!canCreate) return;
    isTemplateFinishedLoading = true;
    const template = exerciseTemplateApi.templates?.find((t) => t.id === Number(selectedTemplateId));

    if (!template || !template.id) {
      isTemplateFinishedLoading = false;
      return;
    }

    try {
      await exerciseApi.createFromTemplate(courseId, String(template.id), { sectionId, order });
      if (exerciseApi.success && exerciseApi.exercise) {
        onCreated(exerciseApi.exercise.id);
      }
    } catch (error) {
      console.log('Error creating exercise from template', error);
      snackbar.error($t('course.navItem.lessons.exercises.new_exercise_modal.errors.template_fetch'));
    } finally {
      isTemplateFinishedLoading = false;
    }
  }

  const handleTagSelection = async (tag: string) => {
    selectedTag = tag;
    selectedTemplateId = '';
    await exerciseTemplateApi.fetchTemplatesByTag(courseId, selectedTag);
  };

  async function handleAddExercise() {
    if (!title.trim() || !canCreate) return;
    await exerciseApi.create(courseId, {
      title: title.trim(),
      sectionId,
      order
    });

    if (exerciseApi.success && exerciseApi.exercise) {
      onCreated(exerciseApi.exercise.id);
    }
  }

  // ============================================
  // COMPUTED VALUES FOR PARENT
  // ============================================

  const canProceedStep0 = $derived(canCreate);
  const canProceedStep1 = $derived(
    type === EXERCISE_CREATE_TYPE.SCRATCH ? title.trim().length > 0 && canCreate : !!selectedTemplateId && canCreate
  );
  const canProceed = $derived(step === 0 ? canProceedStep0 : canProceedStep1);

  const primaryActionLabel = $derived(
    step === 0
      ? $t('course.navItem.lessons.exercises.new_exercise_modal.next')
      : $t('course.navItem.lessons.exercises.new_exercise_modal.finish')
  );

  // ============================================
  // SYNC STATE TO BINDABLE (parent has bind:stepperState)
  // Only assign when values change to avoid infinite re-renders.
  // ============================================
  const isSubmitting = $derived(isLoading || isTemplateFinishedLoading);
  $effect(() => {
    const next = {
      currentStep: step,
      totalSteps: 2,
      canProceed,
      isSubmitting,
      primaryActionLabel
    };
    if (
      stepperState.currentStep !== next.currentStep ||
      stepperState.canProceed !== next.canProceed ||
      stepperState.isSubmitting !== next.isSubmitting ||
      stepperState.primaryActionLabel !== next.primaryActionLabel
    ) {
      stepperState = next;
    }
  });

  // ============================================
  // EXPORTED ACTIONS
  // ============================================
  export const actions: StepperActions = {
    async next() {
      if (step === 0) {
        handleNext();
      } else {
        if (type === EXERCISE_CREATE_TYPE.SCRATCH) {
          await handleAddExercise();
        } else if (type === EXERCISE_CREATE_TYPE.TEMPLATE) {
          await handleTemplateSelection();
        }
      }
    },

    back() {
      handleBack();
    },

    reset() {
      step = 0;
      typeValue = String(EXERCISE_CREATE_TYPE.SCRATCH);
      title = '';
      selectedTag = tags[0];
      selectedTemplateId = undefined;
      isLoading = false;
      isAIStarted = false;
      isTemplateFinishedLoading = false;
      stepperState = { ...EXERCISE_STEPPER_DEFAULT_STATE };
    }
  };
</script>

{#if !isLoading && isAIStarted}
  <Confetti />
{/if}
{#if step === 0}
  <div>
    <Label class="text-md! mb-3">{$t('course.navItem.lessons.exercises.new_exercise_modal.how')}?</Label>

    <RadioGroup.Root
      value={typeValue}
      onValueChange={(v) => (typeValue = v ?? String(EXERCISE_CREATE_TYPE.SCRATCH))}
      class="grid gap-3 md:grid-cols-2"
    >
      {#each options as option (option.id)}
        <RadioOptionCard
          id={option.id}
          title={option.title}
          description={option.description}
          value={String(option.type)}
          disabled={option.isDisabled}
        >
          {#snippet titleSuffix()}
            {#if option.isDisabled}
              <ComingSoon />
            {/if}
          {/snippet}
        </RadioOptionCard>
      {/each}
    </RadioGroup.Root>
  </div>
{:else if step === 1}
  {#if type === EXERCISE_CREATE_TYPE.SCRATCH}
    <div class="m-auto flex min-h-[300px] w-96 items-center justify-center">
      <div class="w-full">
        <InputField
          label={$t('course.navItem.lessons.exercises.new_exercise_modal.title')}
          bind:value={title}
          autoFocus={true}
          placeholder={$t('course.navItem.lessons.exercises.new_exercise_modal.title_placeholder')}
          className="my-4 w-2/4!"
        />
      </div>
    </div>
  {:else if type === EXERCISE_CREATE_TYPE.TEMPLATE}
    <div>
      <Label class="text-md mb-1 font-bold">
        {$t('course.navItem.lessons.exercises.new_exercise_modal.select_template')}
      </Label>

      <div>
        <div class="mb-5 flex items-center gap-2">
          {#each tags as tag}
            <Badge class={selectedTag === tag ? 'bg-primary-400' : ''} onclick={() => handleTagSelection(tag)}
              >{tag}</Badge
            >
          {/each}
        </div>

        {#if exerciseTemplateApi.isLoading}
          <div class="grid grid-cols-2 items-start gap-4 lg:grid-cols-3 xl:grid-cols-4">
            {#each Array(16) as _}
              <div class="h-[140px] w-full rounded-md border-2 border-gray-200 p-5 dark:bg-neutral-700">
                <div class="flex h-full flex-col justify-evenly">
                  <Skeleton class="h-4 w-3/4" />
                  <div class="flex flex-col items-start justify-between gap-1">
                    <Skeleton class="h-3 w-20" />
                    <Skeleton class="h-3 w-16" />
                  </div>
                </div>
              </div>
            {/each}
          </div>
        {:else if exerciseTemplateApi.templates?.length}
          <div class="grid grid-cols-2 items-start gap-4 lg:grid-cols-3 xl:grid-cols-4">
            {#each exerciseTemplateApi.templates as template}
              <button
                type="button"
                class={`h-[140px] w-full rounded-md border-2 p-5 text-left transition ${
                  selectedTemplateId === template.id ? 'border-primary-400' : 'border-gray-200 hover:border-gray-300'
                }`}
                onclick={() => (selectedTemplateId = template.id)}
              >
                <p class="text-sm font-semibold">{template.title}</p>
                <p class="mt-2 text-xs text-gray-500">{template.description}</p>
              </button>
            {/each}
          </div>
        {:else}
          <p class="text-sm text-gray-500">
            {$t('course.navItem.lessons.exercises.new_exercise_modal.no_templates_for_tag')}
          </p>
        {/if}
      </div>
    </div>
  {/if}
{/if}
