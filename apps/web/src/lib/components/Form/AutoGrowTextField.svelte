<script lang="ts">
  export let label = '';
  export let value: string | number | null;
  export let placeholder = '';
  export let inputClassName = '';
  export let labelClassName = 'font-light';
  export let isDisabled = false;
  export let isRequired = false;
  export let bgColor = 'bg-gray-100 focus:bg-primary-50 dark:bg-neutral-800 dark:text-white';
  export let errorMessage = '';
  export let helperMessage = '';
  export let onInput = (e) => {};
  export let onKeyDown = (e) => {};
  export let onInputChange = (e) => {};
  export let onChange = () => {}; // This is to know if element is 'dirty'

  let focusClass = '';
</script>

{#if label}
  <p class="text-sm dark:text-white text-left m-0 {labelClassName}">
    {label}

    {#if isRequired}
      <span class="text-red-700">*</span>
    {/if}
  </p>
{/if}
<span
  class="form-input custom-placeholder w-full block overflow-hidden resize min-h-[50px] leading-5 border mt-2 p-3 pt-3.5 outline-none dark:text-black dark:bg-white form-input border-l-0 border-r-0 border-t-0 border-b-2 border-gray-200 focus:border-l-0 focus:border-r-0 rounded-t-md focus:border-t-0 focus:border-b-2 {inputClassName} {focusClass} {isDisabled &&
    'hover:cursor-not-allowed opacity-50'} dark:text-black p-3 mt-1 block w-full {bgColor} {errorMessage
    ? 'border-red-600'
    : ''}"
  role="textbox"
  tabindex={0}
  contenteditable
  on:input={onInput}
  on:keydown={onKeyDown}
  on:change={onInputChange}
  on:blur={(e) => {
    if (focusClass.includes('border-primary-600')) {
      focusClass = focusClass.replace('border-primary-600', '');
    }
    onChange(e);
  }}
  on:focus={() => (focusClass += ' border-primary-600')}
  style="--placeholder: '{placeholder}'">{value}</span
>
{#if errorMessage}
  <p class="text-sm text-red-500">{errorMessage}</p>
{:else if helperMessage}
  <p class="dark:text-white text-sm">
    {helperMessage}
  </p>
{/if}

<style>
  .custom-placeholder:empty::before {
    content: var(--placeholder, 'Default Placeholder');
  }
  .form-input {
    box-shadow: none !important;
  }
</style>
