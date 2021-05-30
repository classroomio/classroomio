<script>
  export let label;
  export let placeholder;
  export let value;
  export let onKeyDown;
</script>

<label class="block">
  {#if label}<span class="text-gray-700">{label}</span>{/if}
  <input
    class="form-input p-4 mt-1 block w-full rounded-t-lg bg-gray-100 border-t-0 border-l-0 border-r-0 border-b-1"
    type="text"
    on:keydown={onKeyDown}
    {placeholder}
    bind:value
  />
</label>
