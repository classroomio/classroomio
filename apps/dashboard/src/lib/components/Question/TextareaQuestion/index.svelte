<script lang="ts">
  import { preventDefault } from '$lib/utils/functions/svelte';

  import CodeSnippet from '$lib/components/CodeSnippet/index.svelte';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import { VARIANTS } from '$lib/components/PrimaryButton/constants';
  import TextArea from '$lib/components/Form/TextArea.svelte';
  import HtmlRender from '$lib/components/HTMLRender/HTMLRender.svelte';
  import Grade from '$lib/components/Question/Grade.svelte';
  import { t } from '$lib/utils/functions/translations';
  import ReasonBox from '../ReasonBox.svelte';
  import QuestionTitle from '../QuestionTitle.svelte';

  interface Props {
    key: string;
    title?: string;
    index?: number | string;
    code?: string;
    name?: string;
    onSubmit?: any;
    onPrevious?: any;
    defaultValue?: string;
    disablePreviousButton?: boolean;
    isLast?: boolean;
    isPreview?: boolean;
    disabled?: boolean;
    grade?: number;
    gradeMax?: number;
    disableGrading?: boolean;
    isGradeWithAI?: boolean;
    reason?: string;
    isLoading?: boolean;
    hideGrading?: boolean;
  }

  let {
    title = '',
    index = 1,
    code = '',
    name = '',
    onSubmit = (_a: string, _b: string) => {},
    onPrevious = () => {},
    defaultValue = $bindable(''),
    disablePreviousButton = false,
    isLast = false,
    isPreview = false,
    disabled = false,
    grade = $bindable(),
    gradeMax = 0,
    disableGrading = false,
    isGradeWithAI = false,
    reason,
    isLoading = false,
    hideGrading = false
  }: Props = $props();

  let gradeWithAI = $derived(isGradeWithAI);

  function handleFormSubmit() {
    if (isPreview) return;

    onSubmit(name, defaultValue);
    // event.target.reset();
  }

  function handlePrevious(event) {
    event.preventDefault();
    onPrevious();
  }

  function acceptGrade() {
    gradeWithAI = false;
  }
  function rejectGrade() {
    gradeWithAI = false;
    grade = 0;
  }
</script>

<form onsubmit={preventDefault(handleFormSubmit)}>
  <div class="mb-2 flex items-center justify-between">
    <HtmlRender className="mt-4 {typeof grade === 'number' && 'w-4/5'}" disableMaxWidth>
      <QuestionTitle {index} {title} />
    </HtmlRender>
    {#if !hideGrading}
      <Grade {gradeMax} bind:grade {disableGrading} />
    {/if}
  </div>

  {#if code}
    <CodeSnippet {code} />
  {/if}

  <div class="ml-4">
    {#if disabled}
      <div class="mb-3 rounded-md bg-gray-200 px-5 py-3 dark:bg-gray-500">
        {defaultValue === '' ? $t('course.navItem.lessons.exercises.all_exercises.no_answer') : defaultValue}
      </div>
      {#if gradeWithAI}
        <ReasonBox {reason} {isLoading} {acceptGrade} {rejectGrade} />
      {/if}
    {:else}
      <TextArea
        bind:value={defaultValue}
        rows={5}
        placeholder={$t('course.navItem.lessons.exercises.all_exercises.write_your_answer_here')}
      />
    {/if}
  </div>

  {#if !isPreview}
    <div class="mt-3 flex w-full items-center justify-between">
      <PrimaryButton
        variant={VARIANTS.OUTLINED}
        onClick={handlePrevious}
        label={$t('course.navItem.lessons.exercises.all_exercises.previous')}
        isDisabled={disablePreviousButton}
      />
      <PrimaryButton
        variant={VARIANTS.OUTLINED}
        type="submit"
        label={isLast
          ? $t('course.navItem.lessons.exercises.all_exercises.finish')
          : $t('course.navItem.lessons.exercises.all_exercises.next')}
        {name}
      />
    </div>
  {/if}
</form>
