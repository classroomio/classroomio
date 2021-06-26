<script>
  export let label;
  export let placeholder = "Write your answer...";
  export let value;
</script>

<label class="block">
  {#if label}
    <span class="text-gray-700">{label}</span>
  {/if}
  <textarea
    class="form-textarea mt-1 block w-full h-24"
    rows="3"
    {placeholder}
    bind:value
  />

  <slot name="iconbutton" />
</label>
