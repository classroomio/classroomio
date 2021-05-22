<script>
  export let label;
  export let placeholder;
  export let value;
</script>

<label class="block">
  <span class="text-gray-700">{label}</span>
  <input
    class="form-input mt-1 block w-full"
    type="text"
    {placeholder}
    bind:value
  />
</label>
