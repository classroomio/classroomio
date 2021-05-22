<script>
  export let label;
  export let placeholder;
  export let value;
  export let options = [];

  let answer = "Work on ";
</script>

<label class="block">
  <span class="text-gray-700">{label}</span>
  <select bind:value class="form-select block w-full mt-1">
    {#each options as option}
      <option value={option.id}>
        {option.text}
      </option>
    {/each}
  </select>
</label>
