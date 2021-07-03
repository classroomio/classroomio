<script>
  export let label;
  export let placeholder = "Write your answer...";
  export let value;
  export let rows = "3";
  export let maxRows;

  $: minHeight = `${1 + parseInt(rows, 10) * 1.2}em`;
  $: maxHeight = maxRows ? `${1 + maxRows * 1.2}em` : `auto`;
</script>

<label class="block w-full relative">
  {#if label}
    <span class="text-gray-700">{label}</span>
  {/if}

  <pre
    aria-hidden="true"
    style="min-height: {minHeight}; max-height: {maxHeight}">
    {value + '\n'}
  </pre>

  <textarea
    {rows}
    {placeholder}
    bind:value
    class="form-textarea block w-full bg-gray-100 border-t-0 border-l-0 border-r-0 border-b-1"
  />

  <slot name="iconbutton" />
</label>

<style>
  pre,
  textarea {
    font-family: inherit;
    padding: 0.5em;
    box-sizing: border-box;
    border: 1px solid #eee;
    line-height: 1.2;
    overflow: hidden;
  }

  textarea {
    position: absolute;
    width: 100%;
    height: 100%;
    top: 0;
    resize: none;
  }
</style>
