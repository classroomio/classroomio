<script lang="ts">
  interface Props {
    label?: string;
    value: string | number | null;
    placeholder?: string;
    inputClassName?: string;
    labelClassName?: string;
    isDisabled?: boolean;
    isRequired?: boolean;
    bgColor?: string;
    errorMessage?: string;
    helperMessage?: string;
    onInput?: any;
    onKeyDown?: any;
    onInputChange?: any;
    onChange?: any; // This is to know if element is 'dirty'
  }

  let {
    label = '',
    value,
    placeholder = '',
    inputClassName = '',
    labelClassName = 'font-light',
    isDisabled = false,
    isRequired = false,
    bgColor = 'bg-gray-100 focus:bg-primary-50 dark:bg-neutral-800 dark:text-white',
    errorMessage = '',
    helperMessage = '',
    onInput = (e) => {},
    onKeyDown = (e) => {},
    onInputChange = (e) => {},
    onChange = () => {}
  }: Props = $props();

  let focusClass = $state('');
</script>

{#if label}
  <p class="m-0 text-left text-sm dark:text-white {labelClassName}">
    {label}

    {#if isRequired}
      <span class="text-red-700">*</span>
    {/if}
  </p>
{/if}
<span
  class="form-input custom-placeholder form-input mt-2 block min-h-[50px] w-full resize overflow-hidden rounded-t-md border border-b-2 border-l-0 border-r-0 border-t-0 border-gray-200 p-3 pt-3.5 leading-5 outline-hidden focus:border-b-2 focus:border-l-0 focus:border-r-0 focus:border-t-0 dark:border-neutral-600 dark:bg-white dark:text-black {inputClassName} {focusClass} {isDisabled &&
    'opacity-50 hover:cursor-not-allowed'} mt-1 block w-full p-3 dark:text-black {bgColor} {errorMessage
    ? 'border-red-600'
    : ''}"
  role="textbox"
  tabindex={0}
  contenteditable
  oninput={onInput}
  onkeydown={onKeyDown}
  onchange={onInputChange}
  onblur={(e) => {
    if (focusClass.includes('border-primary-600')) {
      focusClass = focusClass.replace('border-primary-600', '');
    }
    onChange(e);
  }}
  onfocus={() => (focusClass += ' border-primary-600')}
  style="--placeholder: '{placeholder}'">{value}</span
>
{#if errorMessage}
  <p class="text-sm text-red-500">{errorMessage}</p>
{:else if helperMessage}
  <p class="text-sm dark:text-white">
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
