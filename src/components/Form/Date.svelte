<script>
  export let label;
  export let placeholder;
  export let value;
</script>

<label class="block">
  <span class="text-gray-700">{label}</span>
  <input
    bind:value
    {placeholder}
    type="date"
    class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
  />
</label>
