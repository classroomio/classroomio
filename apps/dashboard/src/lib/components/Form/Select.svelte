<script lang="ts">
  interface Props {
    label?: string;
    value: any;
    options?: any;
    labelKey?: string;
    isRequired?: boolean;
    className?: string;
    selectClassName?: string;
    onChange?: any; // This is to know if element is 'dirty'
  }

  let {
    label = '',
    value = $bindable(),
    options = [],
    labelKey = 'label',
    isRequired = false,
    className = '',
    selectClassName = '',
    onChange = () => {}
  }: Props = $props();

  // onMount(() => {
  //   value = options[0];
  // });
</script>

<label class="block {className}">
  {#if label}
    <span class="mr-2 text-gray-700 dark:text-white">{label}</span>
  {/if}
  <select
    bind:value
    class="form-select mt-1 block w-auto dark:bg-neutral-700 dark:text-white {selectClassName}"
    required={isRequired}
    onblur={() => {}}
    onchange={onChange}
    class:customColor={!!selectClassName}
  >
    {#each options as option}
      <option class="bg-white text-black" value={option}>
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
