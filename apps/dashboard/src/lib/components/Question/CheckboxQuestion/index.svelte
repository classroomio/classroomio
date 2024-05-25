<script lang="ts">
  import CodeSnippet from '$lib/components/CodeSnippet/index.svelte';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import { VARIANTS } from '$lib/components/PrimaryButton/constants';
  import Checkbox from '$lib/components/Form/Checkbox.svelte';
  import HtmlRender from '$lib/components/HTMLRender/HTMLRender.svelte';
  import Grade from '$lib/components/Question/Grade.svelte';
  import { t } from '$lib/utils/functions/translations';
  import ReasonBox from '../ReasonBox.svelte';
  import { course } from '$lib/components/Course/store';
  import { COURSE_TYPE } from '$lib/utils/types';

  export let title = '';
  export let index = 1;
  export let code;
  export let name = '';
  export let options = [];
  export let onSubmit = () => {};
  export let onPrevious = () => {};
  export let defaultValue = [];
  export let disablePreviousButton = false;
  export let isLast = false;
  export let disabled = false;
  export let isPreview = false;
  export let nextButtonProps = {};
  export let grade: number | undefined;
  export let gradeMax = 0;
  export let disableGrading = false;
  export let isGradeWithAI = false;
  export let reason;
  export let isLoading = false;
  export let hideGrading = false;

  let gradeWithAI = false;

  function getVal(form, name) {
    let values = [];
    const checkboxEl = form.elements[name];

    for (let i = 0, len = checkboxEl.length; i < len; i++) {
      if (checkboxEl[i].checked) {
        values.push(checkboxEl[i].value);
      }
    }

    return values;
  }

  function handleFormSubmit(event) {
    if (isPreview) return;
    const values = getVal(event.target, name);
    onSubmit(name, values);
    event.target.reset();
  }

  function handlePrevious(event) {
    event.preventDefault();
    onPrevious();
  }

  function getValidationClassName(option) {
    if (defaultValue.includes(option.value)) {
      if (option.is_correct) {
        return 'border-green-700';
      } else {
        return 'border-red-700';
      }
    }

    return '';
  }

  function acceptGrade() {
    gradeWithAI = false;
  }
  function rejectGrade() {
    gradeWithAI = false;
    grade = 0;
  }
  $: {
    gradeWithAI = isGradeWithAI;
  }
</script>

<form on:submit|preventDefault={handleFormSubmit}>
  <div class="flex items-center justify-between">
    <HtmlRender className="mt-4">
      <svelte:fragment slot="content">
        <span class={`${typeof grade === 'number' ? 'w-3/4' : ''} flex gap-1`}>
          <h3>{index}</h3>
          <h3>
            {title}
          </h3>
        </span>
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
    {#each options as option}
      <button
        class="cursor-pointer text-left my-2 border-2 border-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-neutral-800 w-full {getValidationClassName(
          option
        )}"
        type="button"
      >
        <Checkbox
          {name}
          className="p-2"
          value={option.value}
          checked={defaultValue.includes(option.value)}
          label={option.label || option.value}
          {disabled}
        />
      </button>
    {/each}
  </div>
  {#if gradeWithAI}
    <ReasonBox {reason} {isLoading} {acceptGrade} {rejectGrade} />
  {/if}

  {#if !isPreview}
    <div class="mt-3 flex items-center justify-between w-full">
      <PrimaryButton
        onClick={handlePrevious}
        label={$t('course.navItem.lessons.exercises.all_exercises.previous')}
        isDisabled={disablePreviousButton}
        variant={VARIANTS.OUTLINED}
      />
      <PrimaryButton
        variant={nextButtonProps.isActive ? VARIANTS.CONTAINED : VARIANTS.OUTLINED}
        type="submit"
        label={isLast
          ? $t('course.navItem.lessons.exercises.all_exercises.finish')
          : $t('course.navItem.lessons.exercises.all_exercises.next')}
        isDisabled={nextButtonProps.isDisabled}
        {name}
      />
    </div>
  {/if}
</form>
