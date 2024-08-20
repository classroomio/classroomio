<script lang="ts">
  import { onMount } from 'svelte';

  export let label = '';
  export let placeholder = '';
  export let value: string | number | null = null;
  export let name = '';
  export let className = '';
  export let inputClassName = '';
  export let labelClassName = '';
  export let bgColor = 'bg-gray-100 focus:bg-primary-50 dark:bg-neutral-700 dark:text-white';
  export let autoFocus = false;
  export let isRequired = false;
  export let isDisabled = false;
  export let errorMessage = '';
  export let helperMessage = '';
  export let autoComplete = true;

  let ref: HTMLInputElement | undefined = undefined;
  let focusClass = '';

  onMount(() => {
    if (autoFocus && ref) {
      ref.focus();
    }
  });
</script>

<label class="block relative {className}">
  {#if label}
    <p class=" dark:text-white text-left m-0 {labelClassName}">
      {label}
      {#if isRequired}
        <span class="text-red-700">*</span>
      {/if}
    </p>
  {/if}

  <input
    class="form-input border-l-0 border-r-0 border-t-0 border-b-2 border-gray-200 dark:border-neutral-600 focus:border-l-0 focus:border-r-0 rounded-t-md focus:border-t-0 focus:border-b-2 {inputClassName} {focusClass} {isDisabled &&
      'hover:cursor-not-allowed opacity-50'} dark:text-black p-3 mt-1 block w-full {bgColor} {errorMessage
      ? 'border-red-600'
      : ''}"
    {placeholder}
    bind:value
    bind:this={ref}
    required={isRequired}
    disabled={isDisabled}
    autocomplete={autoComplete ? 'on' : 'off'}
    on:blur={(e) => {
      if (focusClass.includes('border-primary-600')) {
        focusClass = focusClass.replace('border-primary-600', '');
      }
    }}
    on:focus={() => (focusClass += ' border-primary-600')}
    {name}
  />
  {#if errorMessage}
    <p class="text-sm text-red-500">{errorMessage}</p>
  {:else if helperMessage}
    <p class="dark:text-white text-sm">
      {helperMessage}
    </p>
  {/if}
</label>

<style>
  .form-input {
    box-shadow: none !important;
  }
  .password-eye {
    position: absolute;
    top: 30px;
    right: 6px;
  }
  input::-webkit-outer-spin-button,
  input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
</style>
