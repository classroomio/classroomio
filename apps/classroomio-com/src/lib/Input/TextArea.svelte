<script lang="ts">
  export let label = '';
  export let disabled = false;
  export let placeholder = '';
  export let value = '';
  export let rows = 3;
  // export let maxRows = 3;
  export let className = '';
  export let labelClassName = '';
  export let bgColor = 'bg-gray-50 focus:bg-primary-50 dark:bg-neutral-700 dark:text-white';
  export let helperMessage = '';
  export let errorMessage = '';
  export let isRequired = false;
  export let onChange = () => {}; // This is to know if element is 'dirty'
  export let ref = null;
</script>

<label for="text-field" class="block w-full relative {className}">
  {#if label}
    <p class="dark:text-white text-left w-full flex items-center justify-between {labelClassName}">
      <span>
        {label}
        {#if isRequired}
          <span class="text-red-700">*</span>
        {/if}
      </span>
    </p>
  {/if}

  <textarea
    {disabled}
    {rows}
    {placeholder}
    bind:value
    bind:this={ref}
    required={isRequired}
    class="form-textarea border-l-0 border-r-0 border-t-0 border-b-2 border-gray-200 dark:border-neutral-600 focus:border-l-0 focus:border-r-0 rounded-t-md focus:border-t-0 focus:border-b-2 focus:border-primary-600 mt-1 block w-full
      {bgColor} {!!errorMessage ? 'border-red-500' : 'border-gray-300'}"
    on:change={onChange}
  />
  {#if !!errorMessage}
    <p class="text-sm text-red-500">
      {errorMessage}
    </p>
  {:else if helperMessage}
    <p class="text-sm text-gray-500 dark:text-white">
      {helperMessage}
    </p>
  {/if}
  <slot name="iconbutton" />
</label>

<style>
  .form-textarea {
    box-shadow: none !important;
  }
</style>
