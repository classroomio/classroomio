<script>
  import { onMount } from 'svelte';
  import IconButton from '../IconButton/index.svelte';
  import PasswordEye from '../Icons/PasswordEye.svelte';

  export let label = '';
  export let placeholder = '';
  export let value = '';
  export let onKeyDown = () => {};
  export let className = '';
  export let inputClassName = '';
  export let labelClassName = '';
  export let type = 'text';
  export let isPassword = false;
  export let autoFocus = false;
  export let isRequired = false;
  export let isDisabled = false;
  export let errorMessage = '';
  export let helperMessage = '';
  export let autoComplete = true;
  export let onChange = () => {}; // This is to know if element is 'dirty'
  export let onInputChange = (e) => {};

  let ref;
  let fieldNode;

  function typeAction(node) {
    node.type = type;

    if (isRequired) {
      node.required = '';
    }

    fieldNode = node;
  }

  function handlePasswordEye() {
    type = type === 'password' ? 'text' : 'password';
    typeAction(fieldNode);
  }

  onMount(() => {
    if (autoFocus) {
      ref.focus();
    }

    if (type === 'password') {
      isPassword = true;
    }
  });
</script>

<label class="block relative {className}">
  {#if label}
    <label
      for="text-field"
      class="dark:text-white m-0 font-light {labelClassName}"
    >
      {label}

      {#if isRequired}
        <span class="text-red-700">*</span>
      {/if}
    </label>
  {/if}
  <input
    use:typeAction
    class="form-input dark:text-black p-3 mt-1 block w-full border-none bg-gray-200 {inputClassName} {errorMessage
      ? 'border-red-500'
      : ''}"
    on:keydown={onKeyDown}
    on:change={onInputChange}
    {placeholder}
    bind:value
    bind:this={ref}
    required={isRequired}
    disabled={isDisabled}
    autocomplete={autoComplete ? 'on' : 'off'}
    on:blur={onChange}
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
    <p class="dark:text-white text-sm">
      {helperMessage}
    </p>
  {/if}
</label>

<style>
  .password-eye {
    position: absolute;
    top: 23px;
    right: 6px;
  }
</style>
