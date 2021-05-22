<script>
  export let label;
  export let placeholder;
  export let value;
</script>

<label class="block">
  <span class="text-gray-700">{label}</span>
  <textarea
    class="form-textarea mt-1 block w-full h-24"
    rows="3"
    {placeholder}
    bind:value
  />
</label>
