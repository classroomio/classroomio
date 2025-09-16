<script lang="ts">
  export let title: string;
  export let value: string | number;
  export let subtitle: string = '';
  export let icon: any;
  export let iconColor: string = 'blue';
  export let className: string = '';

  $: colorClasses = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    green: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
    purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
    orange: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400',
    red: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400',
    yellow: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400'
  };
</script>

<div
  class="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800 {className}"
>
  <div class="flex items-center space-x-4">
    <div class="flex h-12 w-12 items-center justify-center rounded-lg {colorClasses[iconColor]}">
      <svelte:component this={icon} className={colorClasses[iconColor]} />
    </div>
    <div>
      <p class="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
      <p class="text-2xl font-semibold text-gray-900 dark:text-white">
        {value}
      </p>
      {#if subtitle}
        <p class="text-xs text-gray-500 dark:text-gray-500">
          {subtitle}
        </p>
      {/if}
    </div>
  </div>
</div>
