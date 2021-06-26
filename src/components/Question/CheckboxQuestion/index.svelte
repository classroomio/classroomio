<script>
  import PrimaryButton from "../../PrimaryButton/index.svelte";
  import Checkbox from "../../Form/Checkbox.svelte";

  export let title = "";
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

  <div class="ml-4">
    {#each options as option}
      <div>
        <Checkbox
          {name}
          value={option.value}
          checked={defaultValue.includes(option.value)}
          label={option.label || option.value}
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
