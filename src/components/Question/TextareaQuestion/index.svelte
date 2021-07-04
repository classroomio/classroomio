<script>
  import PrimaryButton from "../../PrimaryButton/index.svelte";
  import { VARIANTS } from "../../PrimaryButton/constants";
  import CodeSnippet from "../../CodeSnippet/index.svelte";
  import TextArea from "../../Form/TextArea.svelte";

  export let title = "";
  export let code;
  export let name = "";
  export let onSubmit = () => {};
  export let onPrevious = () => {};
  export let defaultValue = "";
  export let disablePreviousButton = false;
  export let isLast = false;
  export let isPreview = false;

  function handleFormSubmit(event) {
    if (isPreview) return;

    onSubmit(name, defaultValue);
    event.target.reset();
  }

  function handlePrevious(event) {
    event.preventDefault();
    onPrevious();
  }
</script>

<form on:submit|preventDefault={handleFormSubmit}>
  <h2>{title}</h2>

  {#if code}
    <CodeSnippet {code} />
  {/if}

  <div class="ml-4">
    <TextArea
      bind:value={defaultValue}
      rows="5"
      placeholder="Write your answer here"
    />
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
        label={isLast ? "Finish" : "Next"}
        {name}
      />
    </div>
  {/if}
</form>
