<script lang="ts">
  import CodeSnippet from '$lib/components/CodeSnippet/index.svelte';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import { VARIANTS } from '$lib/components/PrimaryButton/constants';
  import TextArea from '$lib/components/Form/TextArea.svelte';
  import HtmlRender from '$lib/components/HTMLRender/HTMLRender.svelte';
  import Grade from '$lib/components/Question/Grade.svelte';
  import { t } from '$lib/utils/functions/translations';

  export let title = '';
  export let index = 1;
  export let code = '';
  export let name = '';
  export let onSubmit = () => {};
  export let onPrevious = () => {};
  export let defaultValue = '';
  export let disablePreviousButton = false;
  export let isLast = false;
  export let isPreview = false;
  export let disabled = false;
  export let grade: number | undefined;
  export let gradeMax = 0;
  export let disableGrading = false;

  function handleFormSubmit(event) {
    if (isPreview) return;

    onSubmit(name, defaultValue, true);
    // event.target.reset();
  }

  function handlePrevious(event) {
    event.preventDefault();
    onPrevious();
  }
</script>

<form on:submit|preventDefault={handleFormSubmit}>
  <div class="flex items-center justify-between mb-2">
    <HtmlRender className="mt-4">
      <svelte:fragment slot="content">
        <span class={`${typeof grade === 'number' ? 'w-3/4' : ''} flex gap-1`}>
          <h3>{index}</h3>
          <h3>{title}</h3>
        </span>
      </svelte:fragment>
    </HtmlRender>
    <Grade {gradeMax} bind:grade {disableGrading} />
  </div>

  {#if code}
    <CodeSnippet {code} />
  {/if}

  <div class="ml-4">
    {#if disabled}
      {#if disableGrading}
        <div class="bg-gray-200 dark:bg-gray-500 py-3 px-5 rounded-md mb-3">
          {defaultValue}
        </div>
      {:else}
        <div class="border-2 rounded-md">
          <div class="bg-gray-200 dark:bg-gray-500 py-3 px-5 rounded-md mb-3">
            {defaultValue}
          </div>
          <div class="flex items-start px-2 py-4">
            <div class="flex items-center space-x-4">
              <img src="/ai.svg" alt="alt" />
              <p class="font-normal text-sm">
                Lorem ipsum dolor sit amet consectetur adipisicing elit. Natus distinctio ex atque
                facilis ea non pariatur deleniti blanditiis aliquid molestias.
              </p>
            </div>
            <div class="flex space-x-2">
              <button
                class="border rounded-sm hover:bg-green-400 hover:text-white border-green-400 text-green-400 text-sm font-normal px-2"
              >
                Accept
              </button>
              <button
                class="border rounded-sm border-red-400 hover:bg-red-400 hover:text-white text-red-400 text-sm font-normal px-2"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      {/if}
    {:else}
      <TextArea
        bind:value={defaultValue}
        rows="5"
        placeholder={$t('course.navItem.lessons.exercise.all_exercises.write_your_answer_here')}
      />
    {/if}
  </div>

  {#if !isPreview}
    <div class="mt-3 flex items-center justify-between w-full">
      <PrimaryButton
        variant={VARIANTS.OUTLINED}
        onClick={handlePrevious}
        label="Previous"
        isDisabled={disablePreviousButton}
      />
      <PrimaryButton
        variant={VARIANTS.OUTLINED}
        type="submit"
        label={isLast
          ? $t('course.navItem.lessons.exercise.all_exercises.finish')
          : $t('course.navItem.lessons.exercise.all_exercises.next')}
        {name}
      />
    </div>
  {/if}
</form>
