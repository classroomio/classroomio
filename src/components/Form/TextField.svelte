<script>
  import { onMount } from 'svelte';
  export let label;
  export let placeholder;
  export let value;
  export let onKeyDown;
  export let className = '';
  export let inputClassName = '';
  export let type = 'text';
  export let autoFocus = false;
  export let isRequired = false;
  export let isDisabled = false;
  export let errorMessage;
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
      {label} <span class="text-red-700">*</span>
    </label>
  {/if}
  <input
    id="text-field"
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
  />
  {#if errorMessage}
    <p class="text-sm text-red-500">{errorMessage}</p>
  {/if}
</label>
