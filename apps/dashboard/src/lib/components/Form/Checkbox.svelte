<script>
  import TextField from '$lib/components/Form/TextField.svelte';

  export let label = '';
  export let value;
  export let checked;
  export let name;
  export let isEditable = false;
  export let disabled = false;
  export let className = '';
  export let onChange = (e) => {};
  export let onInputChange = (e) => {};
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
    on:change={(e) => onInputChange(e)}
  />
  {#if isEditable}
    <div class="w-2/4">
      <TextField
        bind:value={label}
        placeholder="Your option"
        className="ml-1"
        type="text"
        {onChange}
      />
    </div>
  {:else}
    <span class="dark:text-white ml-2">{label}</span>
  {/if}

  <slot name="iconbutton" />
</label>
