<script>
  import { onMount } from 'svelte';

  export let label = '';
  export let value;
  export let options = [];
  export let labelKey = 'label';
  export let isRequired = false;
  export let className = '';
  export let selectClassName = '';
  export let onChange = () => {}; // This is to know if element is 'dirty'

  // onMount(() => {
  //   value = options[0];
  // });
</script>

<label class="block {className}">
  {#if label}
    <span class="text-gray-700 dark:text-white mr-2">{label}</span>
  {/if}
  <select
    bind:value
    class="form-select block w-auto mt-1 dark:text-gray-800 {selectClassName}"
    required={isRequired}
    on:blur={() => {}}
    on:change={onChange}
    class:customColor={!!selectClassName}
  >
    {#each options as option}
      <option class="bg-white dark:bg-black text-black" value={option}>
        {option[labelKey]}
      </option>
    {/each}
  </select>
</label>

<style>
  select.customColor {
    font-weight: 700;
    cursor: pointer;
    border-radius: 4px;
    background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' class='text-white' viewBox='0 0 20 20'%3e%3cpath stroke='white' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
  }

  select.customColor option {
    background-color: #fff;
    color: #000;
  }
</style>
