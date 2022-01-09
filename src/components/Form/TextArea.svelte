<script>
  export let label = '';
  export let placeholder = 'Write your answer...';
  export let value = '';
  export let rows = '3';
  export let maxRows = 3;
  export let className = '';
  export let bgColor = 'bg-gray-100';
  export let helperMessage = '';
  export let errorMessage = '';
  export let isRequired = false;
  export let onChange = () => {}; // This is to know if element is 'dirty'

  $: minHeight = `${1 + parseInt(rows, 10) * 1.2}em`;
  $: maxHeight = maxRows ? `${1 + maxRows * 1.2}em` : `auto`;
</script>

<label class="block w-full relative {className}">
  {#if label}
    <p for="text-field" class="">
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
    {rows}
    {placeholder}
    bind:value
    required={isRequired}
    class="form-textarea mt-1 block w-full 
    {bgColor} border-t-0 border-l-0 border-r-0 border-b-1 {!!errorMessage
      ? 'border-red-500'
      : 'border-gray-300'}"
    on:change={onChange}
  />
  {#if !!errorMessage}
    <p class="text-sm text-red-500">
      {errorMessage}
    </p>
  {:else if helperMessage}
    <p class="text-sm text-gray-500">
      {helperMessage}
    </p>
  {/if}
  <slot name="iconbutton" />
</label>

<style>
  /* pre,
  textarea {
    font-family: inherit;
    padding: 0.5em;
    box-sizing: border-box;
    border: 1px solid #eee;
    line-height: 1.2;
    overflow: hidden;
  } */

  /* textarea {
    position: absolute;
    width: 100%;
    height: 100%;
    top: 0;
    resize: none;
  }
  textarea.has-label {
    top: 30px;
  } */
</style>
