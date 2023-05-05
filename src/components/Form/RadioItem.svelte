<script>
  export let label = '';
  export let value = '';
  export let checked = false;
  export let name = '';
  export let isEditable = false;
  export let disabled = false;
  export let className = '';
  export let onChange = () => {}; // This is to know if element is 'dirty'
</script>

<label
  class="{className} inline-flex items-center w-full {disabled
    ? 'cursor-not-allowed'
    : 'cursor-pointer'}"
>
  <input
    class="form-radio"
    type="radio"
    {checked}
    {name}
    {value}
    disabled={disabled || isEditable}
  />
  {#if isEditable}
    <input
      class="form-input p-2 mt-1 ml-1 block w-2/4 bg-gray-100 dark:bg-gray-700 border-t-0 border-l-0 border-r-0 border-b-1"
      type="text"
      placeholder="Your option"
      bind:value={label}
      on:change={onChange}
    />
  {:else}
    <span class="dark:text-white ml-2">{label}</span>
  {/if}

  <slot name="iconbutton" />
</label>
