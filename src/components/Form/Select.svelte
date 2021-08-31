<script>
  import { onMount } from 'svelte';

  export let label = '';
  export let value;
  export let options = [];
  export let labelKey = 'label';
  export let isRequired = false;
  export let className = '';
  export let color = 'default'; // primary
  export let onChange = () => {}; // This is to know if element is 'dirty'

  // onMount(() => {
  //   value = options[0];
  // });
</script>

<label class="block {className}">
  {#if label} <span class="text-gray-700 mr-2">{label}</span> {/if}
  <select
    bind:value
    class="form-select block w-auto mt-1"
    required={isRequired}
    on:change={onChange}
    class:primary={color === 'primary'}
  >
    {#each options as option}
      <option class="bg-white text-black" value={option}>
        {option[labelKey]}
      </option>
    {/each}
  </select>
</label>

<style>
  select.primary {
    font-weight: 700;
    cursor: pointer;
    border-radius: 0.375rem;
    --tw-text-opacity: 1;
    color: rgba(255, 255, 255, var(--tw-text-opacity));
    --tw-bg-opacity: 1;
    background-color: rgba(29, 78, 216, var(--tw-bg-opacity));
    background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' class='text-white' viewBox='0 0 20 20'%3e%3cpath stroke='white' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
  }

  select.primary option {
    background-color: #fff;
    color: #000;
  }
</style>
