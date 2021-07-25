<script>
  import CodeSnippet from '../../CodeSnippet/index.svelte';
  import PrimaryButton from '../../PrimaryButton/index.svelte';
  import { VARIANTS } from '../../PrimaryButton/constants';
  import RadioItem from '../../Form/RadioItem.svelte';

  export let title = '';
  export let code;
  export let name = '';
  export let options = [];
  export let answers = [];
  export let onSubmit = () => {};
  export let onPrevious = () => {};
  export let defaultValue = '';
  export let disablePreviousButton = false;
  export let disabled = false;
  export let isPreview = false;
  export let nextButtonProps = {};

  function getRadioVal(form, name) {
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
        class="cursor-pointer text-left my-2 border-2 border-gray-300 rounded-md hover:bg-gray-200 w-full {getValidationClassName(
          option
        )}"
        type="button"
      >
        <RadioItem
          className="p-2"
          {name}
          value={option.id}
          checked={defaultValue.includes(option.id) &&
            answers.includes(option.id)}
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
