<script lang="ts">
  import { Badge } from '@cio/ui/base/badge';
  import { Spinner } from '@cio/ui/base/spinner';

  import { t } from '$lib/utils/functions/translations';
  import { templateApi } from '$lib/features/template/api';
  import type { ExerciseTemplate } from '$lib/utils/types';
  import { snackbar } from '$lib/components/Snackbar/store';
  import { VARIANTS } from '$lib/components/PrimaryButton/constants';
  import type { GetAllTemplatesMetadataSuccess } from '$lib/features/org/utils/types';

  import { ComingSoon } from '$lib/features/ui';
  import Modal from '$lib/components/Modal/index.svelte';
  import Confetti from '$lib/components/Confetti/index.svelte';
  import TextField from '$lib/components/Form/TextField.svelte';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import CircleCheckIcon from '$lib/components/Icons/CircleCheckIcon.svelte';

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

  const TAGS = {
    HTML: 'HTML',
    CSS: 'CSS',
    JS: 'JS',
    Typescript: 'Typescript',
    ReactJS: 'ReactJS',
    VueJS: 'VueJS',
    NodeJS: 'NodeJS',
    Python: 'Python',
    PHP: 'PHP',
    GIT: 'GIT'
  };

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
  let allTemplates: GetAllTemplatesMetadataSuccess['data'] | undefined = $state();

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
    const template = allTemplates?.[selectedTag]?.find((t) => t.id === selectedTemplateId);

    if (!template) return;

    let fetchedTemplate: ExerciseTemplate;

    try {
      await templateApi.fetchTemplateById(template.id);
      fetchedTemplate = templateApi.template[0];
      console.log('Fetched template', fetchedTemplate);
      await handleTemplateCreate(fetchedTemplate);
    } catch (error) {
      console.log('Error fetching template', error);
      snackbar.error($t('course.navItem.lessons.exercises.new_exercise_modal.errors.template_fetch'));
    } finally {
      isTemplateFinishedLoading = false;
    }
  }

  // const content = $derived(
  //   lessonFallbackNote(
  //     $lesson.materials.note,
  //     $lessonByTranslation[$lesson.id || ''],
  //     $lesson.locale
  //   )
  // );
  // const note = $derived(browser ? getTextFromHTML(content) : '');

  $effect(() => {
    if (!selectedTag) return;
    (async () => {
      await templateApi.fetchTemplateByTag(selectedTag);
      allTemplates = templateApi.templates;
    })();
  });
</script>

<Modal
  onClose={handleCancelAddExercise}
  bind:open
  modalHeading={$t('course.navItem.lessons.exercises.new_exercise_modal.heading')}
  maxWidth="max-w-2xl"
  width="w-4/5"
>
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
              : `border-gray-200 dark:border-neutral-600 ${
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
        <PrimaryButton
          className="px-6 py-3"
          label={$t('course.navItem.lessons.exercises.new_exercise_modal.next')}
          onClick={handleNext}
        />
      </div>
    </div>
  {:else if step === 1}
    {#if type === Type.SCRATCH}
      <div class="m-auto flex min-h-[300px] w-96 items-center justify-center">
        <div class="w-full">
          <h2 class="my-5 text-2xl font-medium">
            {$t('course.navItem.lessons.exercises.new_exercise_modal.title')}
          </h2>
          <TextField
            bind:value={title}
            autoFocus={true}
            placeholder={$t('course.navItem.lessons.exercises.new_exercise_modal.title_placeholder')}
            className="my-4"
          />

          <div class="mt-5 flex items-center justify-between">
            <PrimaryButton
              className="px-6 py-3"
              label={$t('course.navItem.lessons.exercises.new_exercise_modal.back')}
              variant={VARIANTS.OUTLINED}
              onClick={handleBack}
            />
            <PrimaryButton
              className="px-6 py-3"
              label={$t('course.navItem.lessons.exercises.new_exercise_modal.finish')}
              onClick={handleAddExercise}
            />
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
              <Badge
                class={selectedTag === tag ? 'bg-primary-400' : ''}
                onclick={() => {
                  selectedTag = tag;
                  selectedTemplateId = '';
                }}>{tag}</Badge
              >
            {/each}
          </div>

          {#if templateApi.isLoading}
            <div class="flex w-full items-center justify-center py-10">
              <Spinner class="text-white" />
            </div>
          {:else if allTemplates}
            <div class="grid grid-cols-2 items-start gap-4 lg:grid-cols-3 xl:grid-cols-4">
              {#each allTemplates as template}
                <button
                  class="h-[140px] w-full rounded-md border-2 p-5 hover:scale-95 dark:bg-neutral-700 {template.id ===
                  selectedTemplateId
                    ? 'border-primary-400'
                    : `border-gray-200 dark:border-neutral-600 `} flex flex-col transition-all ease-in-out"
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
            <PrimaryButton
              className="px-6 py-3"
              label={$t('course.navItem.lessons.exercises.new_exercise_modal.back')}
              variant={VARIANTS.OUTLINED}
              onClick={handleBack}
            />
            <PrimaryButton
              isDisabled={!selectedTemplateId || !allTemplates}
              className="px-6 py-3"
              label={$t('course.navItem.lessons.exercises.new_exercise_modal.finish')}
              isLoading={isTemplateFinishedLoading}
              onClick={handleTemplateSelection}
            />
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
              <TextField
                label={$t('course.navItem.lessons.exercises.new_exercise_modal.how_many_questions')}
                type="number"
                bind:value={questionNumber}
                placeholder="5"
                className="mb-2"
                isRequired
              />
              <TextField
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
              <PrimaryButton
                onClick={callAI}
                {isLoading}
                isDisabled={isLoading || !note}
                variant={VARIANTS.OUTLINED}
              >
                {$t('course.navItem.lessons.exercises.new_exercise_modal.generate')}
              </PrimaryButton>
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
          <PrimaryButton
            className="px-6 py-3"
            label={$t('course.navItem.lessons.exercises.new_exercise_modal.back')}
            variant={VARIANTS.TEXT}
            onClick={handleBack}
          />
          <PrimaryButton
            isDisabled={isLoading || !note}
            className="px-6 py-3"
            label={$t('course.navItem.lessons.exercises.new_exercise_modal.finish')}
            onClick={handleAddExercise}
          />
        </div>
      </div> -->
    {/if}
  {/if}
</Modal>
