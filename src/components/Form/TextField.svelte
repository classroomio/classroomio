<script>
  export let label;
  export let placeholder;
  export let value;
  export let onKeyDown;
  export let className = "";
</script>

<label class="block {className}">
  {#if label}<h4 class="m-0">{label}</h4>{/if}
  <input
    class="form-input p-2 mt-1 block w-full bg-gray-100 border-t-0 border-l-0 border-r-0 border-b-1"
    type="text"
    on:keydown={onKeyDown}
    {placeholder}
    bind:value
  />
</label>
