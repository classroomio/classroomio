<script lang="ts">
  import { Badge } from '@cio/ui/base/badge';
  import { Skeleton } from '@cio/ui/base/skeleton';
  import { InputField } from '@cio/ui/custom/input-field';
  import { Button } from '@cio/ui/base/button';
  import { t } from '$lib/utils/functions/translations';
  import { exerciseTemplateApi } from '$features/course/api/exercise-template.svelte';
  import { snackbar } from '$features/ui/snackbar/store';
  import { Confetti, ComingSoon } from '$features/ui';
  import { CircleCheckIcon } from '$features/ui/icons';
  import { EXERCISE_TEMPLATE_TAGS } from '$features/course/utils/constants';
  import { exerciseApi } from '$features/course/api';

  interface Props {
    courseId: string;
    sectionId?: string;
    order?: number;
    onCreated: (exerciseId: string) => void;
    onCancel: () => void;
    canCreate: boolean;
  }

  let { courseId, sectionId, order, onCreated, onCancel, canCreate }: Props = $props();

  const Type = {
    SCRATCH: 0,
    TEMPLATE: 1,
    AI: 2
  } as const;

  const options = [
    {
      title: $t('course.navItem.lessons.exercises.new_exercise_modal.options.from_scratch'),
      subtitle: $t('course.navItem.lessons.exercises.new_exercise_modal.options.from_scratch_subtitle'),
      type: Type.SCRATCH,
      isDisabled: false
    },
    {
      title: $t('course.navItem.lessons.exercises.new_exercise_modal.options.use_template'),
      subtitle: $t('course.navItem.lessons.exercises.new_exercise_modal.options.use_template_subtitle'),
      type: Type.TEMPLATE,
      isDisabled: false
    }
  ];

  const tags = Object.values(EXERCISE_TEMPLATE_TAGS);

  let step = $state(0);
  let type: number = $state(Type.SCRATCH);
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
</script>

{#if !isLoading && isAIStarted}
  <Confetti />
{/if}
{#if step === 0}
  <div>
    <h2 class="my-5 text-xl font-medium">{$t('course.navItem.lessons.exercises.new_exercise_modal.how')}?</h2>

    <div class="my-8 flex flex-wrap justify-between gap-2">
      {#each options as option}
        <button
          class="h-52 w-full max-w-[260px] rounded-md border-2 p-5 dark:bg-neutral-700 {option.type === type
            ? 'border-primary-400'
            : `border-gray-200 ${!option.isDisabled && 'hover:scale-95'}`} flex flex-col {option.isDisabled &&
            'cursor-not-allowed opacity-60'} transition-all ease-in-out"
          type="button"
          onclick={!option.isDisabled ? () => (type = option.type) : undefined}
        >
          <div class="flex h-[70%] w-full flex-row-reverse">
            <CircleCheckIcon size={16} filled={option.type === type} />
          </div>

          <div>
            <p class="flex items-center text-start">
              <span class="mr-2 text-sm">{option.title}</span>
              {#if option.isDisabled}
                <ComingSoon />
              {/if}
            </p>
            <p class="text-start text-xs font-light">{option.subtitle}</p>
          </div>
        </button>
      {/each}
    </div>

    <div class="mt-8 flex flex-row-reverse items-center">
      <Button onclick={handleNext} disabled={!canCreate}
        >{$t('course.navItem.lessons.exercises.new_exercise_modal.next')}</Button
      >
    </div>
  </div>
{:else if step === 1}
  {#if type === Type.SCRATCH}
    <div class="m-auto flex min-h-[300px] w-96 items-center justify-center">
      <div class="w-full">
        <h2 class="my-5 text-2xl font-medium">{$t('course.navItem.lessons.exercises.new_exercise_modal.title')}</h2>
        <InputField
          bind:value={title}
          autoFocus={true}
          placeholder={$t('course.navItem.lessons.exercises.new_exercise_modal.title_placeholder')}
          className="my-4"
        />

        <div class="mt-5 flex items-center justify-between">
          <Button variant="outline" onclick={handleBack}
            >{$t('course.navItem.lessons.exercises.new_exercise_modal.back')}</Button
          >
          <Button onclick={handleAddExercise} disabled={!title.trim() || !canCreate}>
            {$t('course.navItem.lessons.exercises.new_exercise_modal.finish')}
          </Button>
        </div>
      </div>
    </div>
  {:else if type === Type.TEMPLATE}
    <div>
      <h2 class="m-0 mb-2 text-2xl font-medium">
        {$t('course.navItem.lessons.exercises.new_exercise_modal.select_template')}
      </h2>

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
          <p class="text-sm text-gray-500">No templates available for this tag.</p>
        {/if}

        <div class="mt-5 flex items-center justify-between">
          <Button variant="outline" onclick={handleBack}
            >{$t('course.navItem.lessons.exercises.new_exercise_modal.back')}</Button
          >
          <Button
            onclick={handleTemplateSelection}
            loading={isTemplateFinishedLoading}
            disabled={!selectedTemplateId || !canCreate}
          >
            {$t('course.navItem.lessons.exercises.new_exercise_modal.finish')}
          </Button>
        </div>
      </div>
    </div>
  {/if}
{/if}

<div class="mt-4 flex justify-end">
  <Button variant="ghost" onclick={onCancel}>Cancel</Button>
</div>
