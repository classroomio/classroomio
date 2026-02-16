<script lang="ts">
  import type { Component } from 'svelte';
  import { cn } from '@cio/ui/tools';

  interface Activity {
    icon: Component;
    title: string;
    percentage: number | string;
    description: string;
    hidePercentage?: boolean;
    className?: string;
  }

  interface Props {
    activity: Activity;
    className?: string;
  }

  let { activity, className = '' }: Props = $props();
</script>

<div
  class={cn(
    'flex w-full flex-col items-center justify-evenly gap-2 rounded-xl border p-3 md:flex-row md:p-5',
    className
  )}
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
    {#if activity.description}
      <p class="text-center text-xs text-gray-500 md:text-left md:text-sm dark:text-gray-300">
        {activity.description}
      </p>
    {/if}
  </div>
</div>
