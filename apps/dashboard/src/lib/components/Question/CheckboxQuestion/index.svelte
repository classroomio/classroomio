<script lang="ts">
  import { preventDefault } from '$lib/utils/functions/svelte';

  import { CodeSnippet } from '$features/ui';
  import { CheckboxField } from '@cio/ui/custom/checkbox-field';
  import HtmlRender from '$lib/components/HTMLRender/HTMLRender.svelte';
  import { Button } from '@cio/ui/base/button';
  import Grade from '$lib/components/Question/Grade.svelte';
  import { t } from '$lib/utils/functions/translations';
  import QuestionTitle from '../QuestionTitle.svelte';
  import ReasonBox from '../ReasonBox.svelte';

  interface Props {
    title?: string;
    index?: number | string;
    code: any;
    name?: string;
    options?: { value: string; label: string }[];
    onSubmit?: any;
    onPrevious?: any;
    defaultValue?: string[];
    disablePreviousButton?: boolean;
    isLast?: boolean;
    disabled?: boolean;
    isPreview?: boolean;
    nextButtonProps?: any;
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
    code,
    name = '',
    options = [],
    onSubmit = (_a: string, _b: string[]) => {},
    onPrevious = () => {},
    defaultValue = [],
    disablePreviousButton = false,
    isLast = false,
    disabled = false,
    isPreview = false,
    nextButtonProps = {
      isDisabled: false,
      isActive: false
    },
    grade = $bindable(0),
    gradeMax = 0,
    disableGrading = false,
    isGradeWithAI = $bindable(false),
    reason = $bindable(''),
    isLoading = $bindable(false),
    hideGrading = false
  }: Props = $props();

  let gradeWithAI = $derived(isGradeWithAI);

  function getVal(form, name) {
    let values: string[] = [];
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
</script>

<form onsubmit={preventDefault(handleFormSubmit)}>
  <div class="flex items-center justify-between">
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
    {#each options as option}
      <button
        class="my-2 w-full cursor-pointer rounded-md border-2 border-gray-300 text-left hover:bg-gray-200 dark:hover:bg-neutral-800 {getValidationClassName(
          option
        )}"
        type="button"
      >
        <CheckboxField
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
    <div class="mt-3 flex w-full items-center justify-between">
      <Button variant="outline" onclick={handlePrevious} disabled={disablePreviousButton}>
        {$t('course.navItem.lessons.exercises.all_exercises.previous')}
      </Button>
      <Button variant={nextButtonProps.isActive ? 'default' : 'outline'} type="submit">
        {isLast
          ? $t('course.navItem.lessons.exercises.all_exercises.finish')
          : $t('course.navItem.lessons.exercises.all_exercises.next')}
        disabled={nextButtonProps.isDisabled}
      </Button>
    </div>
  {/if}
</form>
