<script lang="ts">
  import type { Component } from 'svelte';

  interface Activity {
    icon: Component;
    title: string;
    percentage: number | string;
    description: string;
    hidePercentage?: boolean;
  }

  interface Props {
    activity: Activity;
  }

  let { activity }: Props = $props();
</script>

<div
  class="flex flex-col items-center justify-center gap-5 rounded-xl border p-3 md:flex-row md:p-5 dark:border-neutral-600"
>
  <div class="bg-primary-200 w-fit rounded-full p-4 text-black">
    <activity.icon />
  </div>

  <div>
    <p class="text-center text-sm font-medium text-gray-600 md:text-left dark:text-gray-200">
      {activity.title}
    </p>
    <p class="text-center text-2xl md:text-left">
      {activity.percentage}
      {#if !activity.hidePercentage}
        %
      {/if}
    </p>
    <p class="text-center text-xs text-gray-500 md:text-left md:text-sm dark:text-gray-300">
      {activity.description}
    </p>
  </div>
</div>

