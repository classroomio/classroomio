<script lang="ts">
  import CodeSnippet from '$lib/components/CodeSnippet/index.svelte';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import { VARIANTS } from '$lib/components/PrimaryButton/constants';
  import TextArea from '$lib/components/Form/TextArea.svelte';
  import HtmlRender from '$lib/components/HTMLRender/HTMLRender.svelte';
  import Grade from '$lib/components/Question/Grade.svelte';

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
    <Grade {gradeMax} {grade} {disableGrading} />
  </div>

  {#if code}
    <CodeSnippet {code} />
  {/if}

  <div class="ml-4">
    {#if disabled}
      <div class="bg-gray-200 dark:bg-gray-500 p-5 rounded-md mb-3">
        {defaultValue}
      </div>
    {:else}
      <TextArea bind:value={defaultValue} rows="5" placeholder="Write your answer here" />
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
        label={isLast ? 'Finish' : 'Next'}
        {name}
      />
    </div>
  {/if}
</form>
