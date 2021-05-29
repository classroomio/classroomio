<script>
  export let label;
  export let placeholder;
  export let value;
  export let onKeyDown;
</script>

<label class="block">
  {#if label}<span class="text-gray-700">{label}</span>{/if}
  <input
    class="form-input mt-1 block w-full rounded-lg"
    type="text"
    on:keydown={onKeyDown}
    {placeholder}
    bind:value />
</label>
