<script>
  export let label;
  export let value;
  export let checked;
  export let name;
  export let isEditable = false;
</script>

<label class="inline-flex items-center">
  <input
    class="form-radio"
    type="radio"
    {checked}
    {name}
    {value}
    disabled={isEditable}
  />
  {#if isEditable}
    <input
      class="form-input p-2 mt-1 ml-1 block w-2/4 bg-gray-100 border-t-0 border-l-0 border-r-0 border-b-1"
      type="text"
      placeholder="Your option"
      bind:value={label}
    />
  {:else}
    <span class="ml-2">{label}</span>
  {/if}

  <slot name="iconbutton" />
</label>
