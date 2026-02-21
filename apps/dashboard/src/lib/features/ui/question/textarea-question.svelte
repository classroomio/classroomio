<script lang="ts">
  import { preventDefault } from '$lib/utils/functions/svelte';

  import { CodeSnippet } from '$features/ui';
  import { Button } from '@cio/ui/base/button';
  import { TextareaField } from '@cio/ui/custom/textarea-field';
  import { HTMLRender } from '$features/ui';
  import { Grade } from '$features/ui/question';
  import { t } from '$lib/utils/functions/translations';
  import { ReasonBox } from '$features/ui/question';
  import { QuestionTitle } from '$features/ui/question';

  interface Props {
    key?: string | number;
    title?: string;
    index?: string | number;
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
    grade = $bindable(0),
    gradeMax = 0,
    disableGrading = false,
    isGradeWithAI = $bindable(false),
    reason = $bindable(''),
    isLoading = $bindable(false),
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

  <div class="ml-4">
    {#if disabled}
      <div class="ui:bg-secondary mb-3 rounded-md px-5 py-3">
        {defaultValue === '' ? $t('course.navItem.lessons.exercises.all_exercises.no_answer') : defaultValue}
      </div>
      {#if gradeWithAI}
        <ReasonBox {reason} {isLoading} {acceptGrade} {rejectGrade} />
      {/if}
    {:else}
      <TextareaField
        bind:value={defaultValue}
        rows={5}
        placeholder={$t('course.navItem.lessons.exercises.all_exercises.write_your_answer_here')}
      />
    {/if}
  </div>

  {#if !isPreview}
    <div class="mt-3 flex w-full items-center justify-between">
      <Button variant="outline" onclick={handlePrevious} disabled={disablePreviousButton}>
        {$t('course.navItem.lessons.exercises.all_exercises.previous')}
      </Button>
      <Button variant="outline" type="submit">
        {isLast
          ? $t('course.navItem.lessons.exercises.all_exercises.finish')
          : $t('course.navItem.lessons.exercises.all_exercises.next')}
      </Button>
    </div>
  {/if}
</form>
