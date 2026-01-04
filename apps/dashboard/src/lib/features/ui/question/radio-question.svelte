<script lang="ts">
  import { preventDefault } from '$lib/utils/functions/svelte';

  import { CodeSnippet } from '$features/ui';
  import { Button } from '@cio/ui/base/button';
  import { RadioItem } from '@cio/ui/custom/radio-item';
  import { HTMLRender } from '$features/ui';
  import { Grade } from '$features/ui/question';
  import { t } from '$lib/utils/functions/translations';
  import { ReasonBox } from '$features/ui/question';
  import { QuestionTitle } from '$features/ui/question';

  interface Props {
    key?: string | number;
    title?: string;
    index?: number | string;
    code?: string;
    name?: string;
    options?: { value: string; label: string; is_correct: boolean }[];
    onSubmit?: any;
    onPrevious?: any;
    defaultValue?: string;
    disablePreviousButton?: boolean;
    disabled?: boolean;
    isPreview?: boolean;
    nextButtonProps?: any;
    isLast?: boolean;
    grade?: number;
    gradeMax?: number;
    disableGrading?: boolean;
    disableOptContainerMargin?: boolean;
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
    options = [],
    onSubmit = (_a: string, _b: string[]) => {},
    onPrevious = () => {},
    defaultValue = '',
    disablePreviousButton = false,
    disabled = false,
    isPreview = false,
    nextButtonProps = {
      isDisabled: false,
      isActive: false
    },
    isLast = false,
    grade = $bindable(0),
    gradeMax = 0,
    disableGrading = false,
    disableOptContainerMargin = false,
    isGradeWithAI = $bindable(false),
    reason = $bindable(''),
    isLoading = $bindable(false),
    hideGrading = false
  }: Props = $props();

  let gradeWithAI = $derived(isGradeWithAI);

  function getRadioVal(form, name): string {
    let val;
    const radios = form.elements[name];

    for (let i = 0, len = radios.length; i < len; i++) {
      if (radios[i].checked) {
        val = radios[i].value;
        break;
      }
    }
    return val;
  }

  function handleFormSubmit(event) {
    if (isPreview) return;
    const value = getRadioVal(event.target, name);
    onSubmit(name, [value]);
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
    <HTMLRender className="mt-4 {typeof grade === 'number' && 'w-4/5'}" disableMaxWidth>
      <QuestionTitle {index} {title} />
    </HTMLRender>
    {#if !hideGrading}
      <Grade {gradeMax} bind:grade {disableGrading} />
    {/if}
  </div>

  {#if code}
    <CodeSnippet {code} />
  {/if}

  <div class={disableOptContainerMargin ? '' : 'ml-4'}>
    {#each options as option}
      <button
        class="my-2 w-full cursor-pointer rounded-md border-2 border-gray-300 text-left hover:bg-gray-200 dark:hover:bg-neutral-800 {getValidationClassName(
          option
        )}"
        type="button"
      >
        <RadioItem
          className="p-2"
          {name}
          value={option.value}
          checked={defaultValue.includes(option.value) && option.is_correct}
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
