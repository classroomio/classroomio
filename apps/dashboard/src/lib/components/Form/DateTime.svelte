<script lang="ts">
  interface Props {
    label?: string;
    placeholder?: string;
    value?: string | Date;
    className?: string;
    onInput?: any;
    isRequired?: boolean;
  }

  let {
    label = '',
    placeholder = '',
    value = $bindable(''),
    className = '',
    onInput = () => {},
    isRequired = false
  }: Props = $props();
</script>

<label class="block {className}">
  <span class="text-gray-700 dark:text-white"
    >{label}
    {#if isRequired}
      <span class="text-red-700">*</span>
    {/if}
  </span>
  <input
    bind:value
    oninput={onInput}
    {placeholder}
    type="datetime-local"
    class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 dark:bg-neutral-800 dark:text-white"
  />
</label>
