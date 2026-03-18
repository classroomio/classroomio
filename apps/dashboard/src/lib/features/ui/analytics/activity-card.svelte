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
    classes?: {
      container?: string;
      icon?: string;
      title?: string;
      percentage?: string;
      description?: string;
    };
  }

  let { activity, className = '', classes = {} }: Props = $props();
</script>

<div
  class={cn(
    'flex w-full flex-col items-center justify-evenly gap-2 rounded-xl border p-3 md:flex-row md:px-5 md:py-3',
    className,
    classes.container
  )}
>
  <div class="bg-primary-200 w-fit rounded-full p-4 text-black">
    <activity.icon />
  </div>

  <div>
    <p class={cn('text-center text-sm font-medium text-gray-600 md:text-left dark:text-gray-200', classes.title)}>
      {activity.title}
    </p>
    <p class={cn('text-center text-2xl md:text-left', classes.percentage)}>
      {activity.percentage}
      {#if !activity.hidePercentage}
        %
      {/if}
    </p>
    {#if activity.description}
      <p
        class={cn('text-center text-xs text-gray-500 md:text-left md:text-sm dark:text-gray-300', classes.description)}
      >
        {activity.description}
      </p>
    {/if}
  </div>
</div>
