<script lang="ts">
  interface Props {
    label?: string;
    placeholder?: string;
    value?: string;
    className?: string;
    onChange?: any; // This is to know if element is 'dirty'
  }

  let {
    label = '',
    placeholder = '',
    value = $bindable(''),
    className = '',
    onChange = (e?: Event) => {}
  }: Props = $props();
</script>

<label class="block {className}">
  <span class="text-gray-700 dark:bg-neutral-800 dark:text-white">{label}</span>
  <input
    bind:value
    {placeholder}
    type="date"
    class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 dark:bg-neutral-800 dark:text-white"
    onblur={onChange}
  />
</label>
