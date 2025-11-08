<script lang="ts">
  import { onMount } from 'svelte';
  import { IconButton } from '$lib/components/IconButton';
  import PasswordEye from '../Icons/PasswordEye.svelte';

  interface Props {
    label?: string;
    placeholder?: string;
    value?: string | number | null;
    name?: string;
    onKeyDown?: any;
    className?: string;
    inputClassName?: string;
    labelClassName?: string;
    bgColor?: string;
    type?: string;
    isPassword?: boolean;
    autoFocus?: boolean;
    isRequired?: boolean;
    isDisabled?: boolean;
    min?: string | number | null | undefined;
    max?: string | number | null | undefined;
    errorMessage?: string;
    helperMessage?: string;
    autoComplete?: boolean;
    onChange?: any; // This is to know if element is 'dirty'
    onInputChange?: any;
  }

  let {
    label = '',
    placeholder = '',
    value = $bindable(),
    name = '',
    onKeyDown = (_e) => {},
    className = '',
    inputClassName = '',
    labelClassName = 'font-light',
    bgColor = 'bg-gray-100 focus:bg-primary-50 dark:bg-neutral-700 dark:text-white',
    type = $bindable('text'),
    isPassword = $bindable(false),
    autoFocus = false,
    isRequired = false,
    isDisabled = false,
    min = undefined,
    max = undefined,
    errorMessage = '',
    helperMessage = '',
    autoComplete = true,
    onChange = () => {},
    onInputChange = () => {}
  }: Props = $props();

  let ref: HTMLInputElement | undefined = $state(undefined);
  let fieldNode: HTMLInputElement | undefined = undefined;
  let focusClass = $state('');

  function typeAction(node: HTMLInputElement | undefined) {
    if (!node) return;

    node.type = type || 'text';

    if (isRequired) {
      node.required = true;
    }

    fieldNode = node;
  }

  function handlePasswordEye() {
    type = type === 'password' ? 'text' : 'password';
    typeAction(fieldNode);
  }

  onMount(() => {
    if (autoFocus && ref) {
      ref.focus();
    }

    if (type === 'password') {
      isPassword = true;
    }
  });
</script>

<label class="relative block {className}">
  {#if label}
    <label for="text-field" class="m-0 text-left text-sm dark:text-white {labelClassName}">
      {label}

      {#if isRequired}
        <span class="text-red-700">*</span>
      {/if}
    </label>
  {/if}
  <input
    use:typeAction
    class="form-input rounded-t-md border-b-2 border-l-0 border-r-0 border-t-0 border-gray-200 focus:border-b-2 focus:border-l-0 focus:border-r-0 focus:border-t-0 dark:border-neutral-600 {inputClassName} {focusClass} {isDisabled &&
      'opacity-50 hover:cursor-not-allowed'} mt-1 block w-full p-3 dark:text-black {bgColor} {errorMessage
      ? 'border-red-600'
      : ''}"
    onkeydown={onKeyDown}
    onchange={onInputChange}
    {placeholder}
    bind:value
    bind:this={ref}
    required={isRequired}
    disabled={isDisabled}
    autocomplete={autoComplete ? 'on' : 'off'}
    onblur={(e) => {
      if (focusClass.includes('border-primary-600')) {
        focusClass = focusClass.replace('border-primary-600', '');
      }
      onChange(e);
    }}
    onfocus={() => (focusClass += ' border-primary-600')}
    {name}
    {min}
    {max}
  />
  {#if isPassword}
    <span class="password-eye">
      <IconButton value="write-code" onClick={handlePasswordEye}>
        <PasswordEye isClosed={type === 'password' ? true : false} />
      </IconButton>
    </span>
  {/if}
  {#if errorMessage}
    <p class="text-sm text-red-500">{errorMessage}</p>
  {:else if helperMessage}
    <p class="text-sm opacity-70 dark:text-white">
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

  /* Firefox */
  /* input[type='number'] {
    -moz-appearance: textfield;
  } */
</style>
