<script>
  import PrimaryButton from "../../PrimaryButton/index.svelte";
  import CodeSnippet from "../../CodeSnippet/index.svelte";
  import Checkbox from "../../Form/Checkbox.svelte";

  export let title = "";
  export let code;
  export let name = "";
  export let options = [];
  export let onSubmit = () => {};
  export let onPrevious = () => {};
  export let defaultValue = [];
  export let disablePreviousButton = false;
  export let isLast = false;

  function getRadioVal(form, name) {
    let values = [];
    const radios = form.elements[name];

    for (let i = 0, len = radios.length; i < len; i++) {
      if (radios[i].checked) {
        values.push(radios[i].value);
      }
    }

    return values;
  }

  function handleFormSubmit(event) {
    const values = getRadioVal(event.target, name);
    onSubmit(name, values);
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
    {#each options as option}
      <button
        class="text-left my-2 border border-gray-300 p-2 rounded-md cursor-pointer hover:bg-gray-200 w-full"
        type="button"
      >
        <Checkbox
          {name}
          value={option.value}
          checked={defaultValue.includes(option.value)}
          label={option.label || option.value}
        />
      </button>
    {/each}
  </div>
  <div class="mt-3 flex items-center justify-between w-full">
    <PrimaryButton
      onClick={handlePrevious}
      label="Previous"
      isDisabled={disablePreviousButton}
    />
    <PrimaryButton type="submit" label={isLast ? "Finish" : "Next"} {name} />
  </div>
</form>
