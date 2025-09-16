<script lang="ts">
  import { ChartBar } from 'carbon-icons-svelte';

  export let title: string = 'No data available';
  export let description: string = 'There is no data to display at this time.';
  export let icon: any = ChartBar;
  export let className: string = '';
</script>

<div class="flex flex-col items-center justify-center px-4 py-12 {className}">
  <div
    class="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800"
  >
    <svelte:component this={icon} size="24" class="text-gray-400 dark:text-gray-500" />
  </div>
  <h3 class="mb-2 text-lg font-medium text-gray-900 dark:text-white">
    {title}
  </h3>
  <p class="max-w-sm text-center text-sm text-gray-500 dark:text-gray-400">
    {description}
  </p>
</div>
