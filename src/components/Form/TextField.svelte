<script>
  import { afterUpdate } from 'svelte';
  export let label;
  export let placeholder;
  export let value;
  export let onKeyDown;
  export let className = '';
  export let inputClassName = '';
  export let type = 'text';
  export let autoFocus = false;
  export let isRequired = false;

  let ref;

  function typeAction(node) {
    node.type = type;

    if (isRequired) {
      node.required = '';
    }
  }

  afterUpdate(() => {
    if (autoFocus) {
      ref.focus();
    }
  });
</script>

<label class="block {className}">
  {#if label}<label class="m-0">{label}</label>{/if}
  <input
    use:typeAction
    class="form-input {inputClassName} p-2 mt-1 block w-full bg-white border border-gray-300"
    on:keydown={onKeyDown}
    {placeholder}
    bind:value
    bind:this={ref}
    required={true}
  />
</label>
