<script>
  import CodeSnippet from '../../CodeSnippet/index.svelte';
  import PrimaryButton from '../../PrimaryButton/index.svelte';
  import { VARIANTS } from '../../PrimaryButton/constants';
  import Checkbox from '../../Form/Checkbox.svelte';

  export let title = '';
  export let code;
  export let name = '';
  export let options = [];
  export let answers = [];
  export let onSubmit = () => {};
  export let onPrevious = () => {};
  export let defaultValue = [];
  export let disablePreviousButton = false;
  export let disabled = false;
  export let isPreview = false;
  export let nextButtonProps = {};

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
    // event.target.reset();
  }

  function handlePrevious(event) {
    event.preventDefault();
    onPrevious();
  }

  function getValidationClassName(option) {
    if (defaultValue.includes(option.id)) {
      if (answers.includes(option.id)) {
        return 'border-green-700';
      } else {
        return 'border-red-700';
      }
    }

    return '';
  }
</script>

<form on:submit|preventDefault={handleFormSubmit}>
  <h2>{title}</h2>

  {#if code}
    <CodeSnippet {code} />
  {/if}

  <div class="ml-4">
    {#each options as option}
      <button
        class="cursor-pointer text-left my-2 border-2 border-gray-300 p-2 rounded-md cursor-pointer hover:bg-gray-200 w-full {getValidationClassName(
          option
        )}"
        type="button"
      >
        <Checkbox
          {name}
          value={option.id}
          checked={defaultValue.includes(option.id)}
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
