<script>
  import PrimaryButton from "../../PrimaryButton/index.svelte";
  import RadioItem from "../../Form/RadioItem.svelte";

  export let title = "";
  export let name = "";
  export let options = [];
  export let onSubmit = () => {};
  export let onPrevious = () => {};
  export let defaultValue = "";
  export let disablePreviousButton = false;
  export let isLast = false;

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
    const value = getRadioVal(event.target, name);
    onSubmit(name, value);
    event.target.reset();
  }

  function handlePrevious(event) {
    event.preventDefault();
    onPrevious();
  }
</script>

<form on:submit|preventDefault={handleFormSubmit}>
  <h2>{title}</h2>

  <div class="ml-4">
    {#each options as option}
      <div>
        <RadioItem
          {name}
          value={option.value}
          checked={option.value === defaultValue}
          label={option.label}
        />
      </div>
    {/each}
  </div>
  <div class="mt-3">
    {#if disablePreviousButton === false}
      <PrimaryButton onClick={handlePrevious} label="Previous" />
    {/if}
    <PrimaryButton type="submit" label={isLast ? "Finish" : "Next"} {name} />
  </div>
</form>
