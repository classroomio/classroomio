<script>
  export let label = '';
  export let disabled = false;
  export let placeholder = 'Write your answer...';
  export let value = '';
  export let rows = '3';
  export let maxRows = 3;
  export let className = '';
  export let labelClassName = '';
  export let bgColor = 'bg-gray-50 focus:bg-primary-50 dark:bg-white';
  export let helperMessage = '';
  export let errorMessage = '';
  export let isRequired = false;
  export let onChange = () => {}; // This is to know if element is 'dirty'

  $: minHeight = `${1 + parseInt(rows, 10) * 1.2}em`;
  $: maxHeight = maxRows ? `${1 + maxRows * 1.2}em` : `auto`;
</script>

<label class="block w-full relative {className}">
  {#if label}
    <p for="text-field" class="dark:text-white text-left {labelClassName}">
      {label}

      {#if isRequired}
        <span class="text-red-700">*</span>
      {/if}
    </p>
  {/if}

  <!-- <pre
    aria-hidden="true"
    style="min-height: {minHeight}; max-height: {maxHeight}">
    {value + '\n'}
  </pre> -->

  <textarea
    {disabled}
    {rows}
    {placeholder}
    bind:value
    required={isRequired}
    class="form-textarea dark:bg-gray-500 dark:text-gray-800 border-l-0 border-r-0 border-t-0 border-b-2 border-gray-200 focus:border-l-0 focus:border-r-0 rounded-t-md focus:border-t-0 focus:border-b-2 focus:border-primary-600 mt-1 block w-full
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
