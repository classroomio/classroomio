<script>
  import CodeSnippet from '../../CodeSnippet/index.svelte';
  import PrimaryButton from '../../PrimaryButton/index.svelte';
  import { VARIANTS } from '../../PrimaryButton/constants';
  import Checkbox from '../../Form/Checkbox.svelte';
  import TextField from '../../Form/TextField.svelte';

  export let title = '';
  export let code;
  export let name = '';
  export let options = [];
  export let onSubmit = () => {};
  export let onPrevious = () => {};
  export let defaultValue = [];
  export let disablePreviousButton = false;
  export let disabled = false;
  export let isPreview = false;
  export let nextButtonProps = {};
  export let grade;
  export let gradeMax = 0;
  export let disableGrading = false;

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
    onSubmit(name, values, nextButtonProps.isActive);
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
        <p class="ml-2 text-lg">/ {gradeMax}</p>
      </div>
    {/if}
  </div>

  {#if code}
    <CodeSnippet {code} />
  {/if}

  <div class="ml-4">
    {#each options as option}
      <button
        class="cursor-pointer text-left my-2 border-2 border-gray-300 rounded-md hover:bg-gray-200 w-full {getValidationClassName(
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
  {#if !isPreview}
    <div class="mt-3 flex items-center justify-between w-full">
      <PrimaryButton
        onClick={handlePrevious}
        label="Previous"
        isDisabled={disablePreviousButton}
        variant={VARIANTS.OUTLINED}
      />
      <PrimaryButton
        variant={nextButtonProps.isActive
          ? VARIANTS.CONTAINED
          : VARIANTS.OUTLINED}
        type="submit"
        label={nextButtonProps.label}
        {name}
      />
    </div>
  {/if}
</form>
