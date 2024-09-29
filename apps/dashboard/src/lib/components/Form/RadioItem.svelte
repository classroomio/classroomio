<script>
  import TextField from '$lib/components/Form/TextField.svelte';
  export let label = '';
  export let value = '';
  export let checked = false;
  export let name = '';
  export let isEditable = false;
  export let disabled = false;
  export let className = '';
  export let onInputChange = () => {};
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
    on:change={onInputChange}
    disabled={disabled || isEditable}
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
