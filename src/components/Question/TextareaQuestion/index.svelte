<script>
  import CodeSnippet from '../../CodeSnippet/index.svelte';
  import marked from 'marked';
  import PrimaryButton from '../../PrimaryButton/index.svelte';
  import { VARIANTS } from '../../PrimaryButton/constants';
  import TextArea from '../../Form/TextArea.svelte';
  import TextField from '../../Form/TextField.svelte';

  export let title = '';
  export let code;
  export let name = '';
  export let onSubmit = () => {};
  export let onPrevious = () => {};
  export let defaultValue = '';
  export let disablePreviousButton = false;
  export let isLast = false;
  export let isPreview = false;
  export let disabled = false;
  export let grade;
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
  <div class="flex items-center justify-between">
    <h3 class={!isNaN(grade) && 'w-3/4'}>{title}</h3>
    {#if !isNaN(grade)}
      <div class="flex items-center">
        <TextField
          placeholder="Points"
          bind:value={grade}
          type="number"
          className="w-20"
          isDisabled={disableGrading}
        />
        <p class="dark:text-white ml-2 text-lg">/ {gradeMax}</p>
      </div>
    {/if}
  </div>

  {#if code}
    <CodeSnippet {code} />
  {/if}

  <div class="ml-4">
    {#if disabled}
      <div class="bg-gray-200 dark:bg-gray-500 p-5 rounded-md mb-3">
        {@html marked(defaultValue)}
      </div>
    {:else}
      <TextArea
        bind:value={defaultValue}
        rows="5"
        placeholder="Write your answer here"
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
        label={isLast ? 'Finish' : 'Next'}
        {name}
      />
    </div>
  {/if}
</form>
