<script>
  export let label;
  export let value;
  export let checked;
  export let name;
  export let isEditable = false;
  export let disabled = false;
  export let className = '';
  export let onChange;
</script>

<label
  class="{className} inline-flex items-center w-full {disabled
    ? 'cursor-not-allowed'
    : 'cursor-pointer'}"
>
  <input
    type="checkbox"
    class="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-offset-0 focus:ring-indigo-200 focus:ring-opacity-50"
    {name}
    {value}
    disabled={disabled || isEditable}
    bind:checked
  />
  {#if isEditable}
    <input
      class="form-input p-2 mt-1 ml-1 block w-2/4 bg-gray-100 border-t-0 border-l-0 border-r-0 border-b-1"
      type="text"
      placeholder="Your option"
      bind:value={label}
      on:change={onChange}
    />
  {:else}
    <span class="ml-2">{label}</span>
  {/if}

  <slot name="iconbutton" />
</label>
