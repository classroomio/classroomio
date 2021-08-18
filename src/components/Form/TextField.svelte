<script>
  import { onMount } from 'svelte';
  export let label = '';
  export let placeholder = '';
  export let value = '';
  export let onKeyDown = () => {};
  export let className = '';
  export let inputClassName = '';
  export let type = 'text';
  export let autoFocus = false;
  export let isRequired = false;
  export let isDisabled = false;
  export let errorMessage = '';
  export let helperMessage = '';
  export let autoComplete = true;
  export let onChange = () => {}; // This is to know if element is 'dirty'

  let ref;

  function typeAction(node) {
    node.type = type;

    if (isRequired) {
      node.required = '';
    }
  }

  onMount(() => {
    if (autoFocus) {
      ref.focus();
    }
  });
</script>

<label class="block {className}">
  {#if label}
    <label for="text-field" class="m-0">
      {label}

      {#if isRequired}
        <span class="text-red-700">*</span>
      {/if}
    </label>
  {/if}
  <input
    use:typeAction
    class="form-input p-2 mt-1 block w-full bg-white border {inputClassName} {errorMessage
      ? 'border-red-500'
      : 'border-gray-300'}"
    on:keydown={onKeyDown}
    {placeholder}
    bind:value
    bind:this={ref}
    required={isRequired}
    disabled={isDisabled}
    autocomplete={autoComplete ? 'on' : 'off'}
    on:blur={onChange}
  />
  {#if errorMessage}
    <p class="text-sm text-red-500">{errorMessage}</p>
  {:else if helperMessage}
    <p class="text-sm">
      {helperMessage}
    </p>
  {/if}
</label>
