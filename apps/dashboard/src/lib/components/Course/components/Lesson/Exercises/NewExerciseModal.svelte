<script lang="ts">
  import { Badge } from '@cio/ui/base/badge';
  import { Skeleton } from '@cio/ui/base/skeleton';
  import * as Dialog from '@cio/ui/base/dialog';
  import { InputField } from '@cio/ui/custom/input-field';
  import { Button } from '@cio/ui/base/button';

  import { t } from '$lib/utils/functions/translations';
  import { exerciseTemplateApi } from '$features/exercise-template/api';
  import { snackbar } from '$features/ui/snackbar/store';
  import { Confetti, ComingSoon } from '$features/ui';
  import { CircleCheckIcon } from '$features/ui/icons';
  import { TAGS } from '$features/exercise-template/utils/constants';
  import type { ExerciseTemplate } from '$lib/utils/types';

  interface Props {
    open: boolean;
    handleAddExercise: () => void;
    handleCancelAddExercise: () => void;
    handleTemplateCreate: (template: ExerciseTemplate) => Promise<void>;
    title: string;
  }

  let {
    open = $bindable(false),
    handleAddExercise = () => {},
    handleCancelAddExercise = () => {},
    handleTemplateCreate,
    title = $bindable('')
  }: Props = $props();

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
    // TODO: Come back to fix ai implementation
    // {
    //   title: $t('course.navItem.lessons.exercises.new_exercise_modal.options.use_ai'),
    //   subtitle: $t('course.navItem.lessons.exercises.new_exercise_modal.options.use_ai_subtitle'),
    //   type: Type.AI,
    //   isDisabled: false
    // }
  ];

  const tags = Object.values(TAGS);

  let step = $state(0);
  let type: number = $state(Type.SCRATCH);
  // let questionNumber = $state(5);
  // let optionNumber = $state(5);
  let isLoading = $state(false);
  let isAIStarted = $state(false);

  let selectedTag = $state(tags[0]);
  let selectedTemplateId = $state('');
  let isTemplateFinishedLoading = $state(false);

  // const {
  //   input,
  //   handleSubmit
  // completion
  // } = useCompletion({
  //   api: '/api/completion/exerciseprompt',
  //   onFinish: async (/**prompt: string, completion: string*/) => {
  //     if (!$lesson.id) return;

  // toggleConfetti();
  // const responseData = completion. $completion.replace('```json', '').replace('```', '');
  // const template: ExerciseTemplate = JSON.parse(responseData);
  // await handleTemplateCreate(template);
  // toggleConfetti();
  //     isLoading = false;
  //   }
  // });

  function handleNext() {
    step = step + 1;
  }

  function handleBack() {
    step = step - 1;
  }

  // function callAI() {
  //   $input = JSON.stringify({
  //     questionNumber,
  //     optionNumber,
  //     lessonNote: note
  //   });

  //   setTimeout(() => {
  //     isAIStarted = true;
  //     isLoading = true;
  //     handleSubmit({ preventDefault: () => {} });
  //   }, 500);
  // }

  async function handleTemplateSelection() {
    isTemplateFinishedLoading = true;
    const template = exerciseTemplateApi.templates?.find((t) => t.id === Number(selectedTemplateId));

    if (!template) return;

    let fetchedTemplate: ExerciseTemplate;

    try {
      await exerciseTemplateApi.fetchTemplateById(template.id);
      fetchedTemplate = exerciseTemplateApi.template[0];
      console.log('Fetched template', fetchedTemplate);
      await handleTemplateCreate(fetchedTemplate);
    } catch (error) {
      console.log('Error fetching template', error);
      snackbar.error($t('course.navItem.lessons.exercises.new_exercise_modal.errors.template_fetch'));
    } finally {
      isTemplateFinishedLoading = false;
    }
  }

  const handleTagSelection = async (tag: string) => {
    selectedTag = tag;
    selectedTemplateId = '';
    await exerciseTemplateApi.fetchTemplatesByTag(selectedTag);
  };

  // const content = $derived(
  //   lessonFallbackNote(
  //     $lesson.materials.note,
  //     $lessonByTranslation[$lesson.id || ''],
  //     $lesson.locale
  //   )
  // );
  // const note = $derived(browser ? getTextFromHTML(content) : '');
</script>

<Dialog.Root
  bind:open
  onOpenChange={(isOpen) => {
    if (!isOpen) handleCancelAddExercise();
  }}
>
  <Dialog.Content class="w-4/5 max-w-2xl">
    <Dialog.Header>
      <Dialog.Title>{$t('course.navItem.lessons.exercises.new_exercise_modal.heading')}</Dialog.Title>
    </Dialog.Header>
    {#if !isLoading && isAIStarted}
      <Confetti />
    {/if}
    {#if step === 0}
      <div>
        <h2 class="my-5 text-2xl font-medium">
          {$t('course.navItem.lessons.exercises.new_exercise_modal.how')}?
        </h2>

        <div class="my-8 flex justify-between gap-2">
          {#each options as option}
            <button
              class="h-60 w-[261px] rounded-md border-2 p-5 dark:bg-neutral-700 {option.type === type
                ? 'border-primary-400'
                : `border-gray-200 ${
                    !option.isDisabled && 'hover:scale-95'
                  }`} flex flex-col {option.isDisabled && 'cursor-not-allowed opacity-60'} transition-all ease-in-out"
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
          <Button onclick={handleNext}>
            {$t('course.navItem.lessons.exercises.new_exercise_modal.next')}
          </Button>
        </div>
      </div>
    {:else if step === 1}
      {#if type === Type.SCRATCH}
        <div class="m-auto flex min-h-[300px] w-96 items-center justify-center">
          <div class="w-full">
            <h2 class="my-5 text-2xl font-medium">
              {$t('course.navItem.lessons.exercises.new_exercise_modal.title')}
            </h2>
            <InputField
              bind:value={title}
              autoFocus={true}
              placeholder={$t('course.navItem.lessons.exercises.new_exercise_modal.title_placeholder')}
              className="my-4"
            />

            <div class="mt-5 flex items-center justify-between">
              <Button variant="outline" onclick={handleBack}>
                {$t('course.navItem.lessons.exercises.new_exercise_modal.back')}
              </Button>
              <Button onclick={handleAddExercise}>
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
                  <div
                    class="h-[140px] w-full rounded-md border-2 border-gray-200 p-5 dark:bg-neutral-700"
                  >
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
            {:else if exerciseTemplateApi.templates.length > 0}
              <div class="grid grid-cols-2 items-start gap-4 lg:grid-cols-3 xl:grid-cols-4">
                {#each exerciseTemplateApi.templates as template}
                  <button
                    class="h-[140px] w-full rounded-md border-2 p-5 hover:scale-95 dark:bg-neutral-700 {template.id ===
                    selectedTemplateId
                      ? 'border-primary-400'
                      : `border-gray-200 `} flex flex-col transition-all ease-in-out"
                    type="button"
                    onclick={() => (selectedTemplateId = template.id)}
                  >
                    <div class="flex h-full flex-col justify-evenly">
                      <p class="flex items-center text-start text-sm">
                        {template.title}
                      </p>
                      <div class="flex flex-col items-start justify-between gap-1">
                        <p class="text-xs font-normal">
                          {template.questions}
                          {$t('course.navItem.lessons.exercises.new_exercise_modal.questions')}
                        </p>
                        <p class="text-start text-xs font-normal">
                          {template.points}
                          {$t('course.navItem.lessons.exercises.new_exercise_modal.points')}
                        </p>
                      </div>
                    </div>
                  </button>
                {/each}
              </div>
            {/if}

            <div class="mt-5 flex items-center justify-between">
              <Button variant="outline" onclick={handleBack}>
                {$t('course.navItem.lessons.exercises.new_exercise_modal.back')}
              </Button>
              <Button
                disabled={!selectedTemplateId || exerciseTemplateApi.templates.length === 0}
                loading={isTemplateFinishedLoading}
                onclick={handleTemplateSelection}
              >
                {$t('course.navItem.lessons.exercises.new_exercise_modal.finish')}
              </Button>
            </div>
          </div>
        </div>
        <!-- {:else if type === Type.AI} -->
        <!-- <div>
        <div class="flex max-h-[500px] flex-row justify-between">
          <div class="mr-1 w-[60%] rounded-md border px-3 py-2">
            {#if note.length}
              <h3>{$t('course.navItem.lessons.exercises.new_exercise_modal.create_exercises')}</h3>
              <p class="mb-4 text-sm">
                {$t('course.navItem.lessons.exercises.new_exercise_modal.choose_questions')}
              </p>
              <InputField
                label={$t('course.navItem.lessons.exercises.new_exercise_modal.how_many_questions')}
                type="number"
                bind:value={questionNumber}
                placeholder="5"
                className="mb-2"
                isRequired
              />
              <InputField
                label={$t('course.navItem.lessons.exercises.new_exercise_modal.how_many_options')}
                type="number"
                bind:value={optionNumber}
                placeholder="5"
                isRequired
              />
            {:else}
              <h3>{$t('course.navItem.lessons.exercises.new_exercise_modal.add_note')}</h3>
            {/if}
            <div class="mt-5 flex flex-row-reverse items-center">
              <Button
                onclick={callAI}
                loading={isLoading}
                disabled={isLoading || !note}
                variant="outline"
              >
                {$t('course.navItem.lessons.exercises.new_exercise_modal.generate')}
              </Button>
            </div>
          </div>
          <div
            class="flex w-[40%] items-center justify-center overflow-y-auto rounded-md border px-5 py-3"
          >
            {#if isLoading}
              <Circle3 size="60" unit="px" duration="1s" />
            {:else if isAIStarted}
              <p class="max-h-[200px] text-sm leading-7">
                {$t('course.navItem.lessons.exercises.new_exercise_modal.completion')}
              </p>
            {:else}
              <p class="max-h-[200px] text-sm leading-7">
                {$t('course.navItem.lessons.exercises.new_exercise_modal.click_generate')}
              </p>
            {/if}
          </div>
        </div>
        <div class="mt-5 flex items-center justify-between">
          <Button
            variant="ghost"
            onclick={handleBack}
          >
            {$t('course.navItem.lessons.exercises.new_exercise_modal.back')}
          </Button>
          <Button
            disabled={isLoading || !note}
            onclick={handleAddExercise}
          >
            {$t('course.navItem.lessons.exercises.new_exercise_modal.finish')}
          </Button>
        </div>
      </div> -->
      {/if}
    {/if}
  </Dialog.Content>
</Dialog.Root>
