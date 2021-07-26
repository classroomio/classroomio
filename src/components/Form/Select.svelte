<script>
  export let label;
  export let value;
  export let options = [];
  export let valueKey = 'id';
  export let isRequired = false;
</script>

<label class="block">
  {#if label} <span class="text-gray-700">{label}</span> {/if}
  <select
    bind:value
    class="form-select block w-full mt-1"
    required={isRequired}
  >
    {#each options as option}
      <option value={option[valueKey]}>
        {option.text}
      </option>
    {/each}
  </select>
</label>
