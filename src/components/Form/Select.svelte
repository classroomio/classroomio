<script>
  export let label = '';
  export let value = '';
  export let options = [];
  export let labelKey = 'label';
  export let isRequired = false;
  export let onChange = () => {}; // This is to know if element is 'dirty'
</script>

<label class="block">
  {#if label} <span class="text-gray-700">{label}</span> {/if}
  <select
    bind:value
    class="form-select block w-full mt-1"
    required={isRequired}
    on:blur={onChange}
  >
    {#each options as option}
      <option value={option}>
        {option[labelKey]}
      </option>
    {/each}
  </select>
</label>
