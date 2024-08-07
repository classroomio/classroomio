<script lang="ts">
  import CodeSnippet from '$lib/components/CodeSnippet/index.svelte';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import { VARIANTS } from '$lib/components/PrimaryButton/constants';
  import TextArea from '$lib/components/Form/TextArea.svelte';
  import HtmlRender from '$lib/components/HTMLRender/HTMLRender.svelte';
  import Grade from '$lib/components/Question/Grade.svelte';
  import { t } from '$lib/utils/functions/translations';
  import ReasonBox from '../ReasonBox.svelte';
  import QuestionTitle from '../QuestionTitle.svelte';

  export let title = '';
  export let index = 1;
  export let code = '';
  export let name = '';
  export let onSubmit = (a: string, b: string) => {};
  export let onPrevious = () => {};
  export let defaultValue = '';
  export let disablePreviousButton = false;
  export let isLast = false;
  export let isPreview = false;
  export let disabled = false;
  export let grade: number | undefined;
  export let gradeMax = 0;
  export let disableGrading = false;
  export let isGradeWithAI = false;
  export let reason;
  export let isLoading = false;
  export let hideGrading = false;

  let gradeWithAI = false;

  function handleFormSubmit(event) {
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

  $: gradeWithAI = isGradeWithAI;
</script>

<form on:submit|preventDefault={handleFormSubmit}>
  <div class="flex items-center justify-between mb-2">
    <HtmlRender className="mt-4 {typeof grade === 'number' && 'w-4/5'}" disableMaxWidth>
      <svelte:fragment slot="content">
        <QuestionTitle {index} {title} />
      </svelte:fragment>
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
      <div class="bg-gray-200 dark:bg-gray-500 py-3 px-5 rounded-md mb-3">
        {defaultValue === ''
          ? $t('course.navItem.lessons.exercises.all_exercises.no_answer')
          : defaultValue}
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
    <div class="mt-3 flex items-center justify-between w-full">
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
