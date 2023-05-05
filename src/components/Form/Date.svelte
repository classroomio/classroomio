<script>
  export let label;
  export let placeholder;
  export let value;
  export let className = '';
  export let onChange = () => {}; // This is to know if element is 'dirty'
</script>

<label class="block {className}">
  <span class="text-gray-700 dark:text-white">{label}</span>
  <input
    bind:value
    {placeholder}
    type="date"
    class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
    on:blur={onChange}
  />
</label>
