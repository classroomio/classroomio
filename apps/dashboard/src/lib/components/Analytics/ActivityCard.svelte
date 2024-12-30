<script lang="ts">
  interface Activity {
    icon: any;
    title: string;
    percentage: number;
    description: string;
    hidePercentage?: boolean;
  }

  export let activity: Activity;
</script>

<div
  class="flex flex-col items-center justify-center gap-5 rounded-xl border p-3 dark:border-neutral-600 md:flex-row md:p-5"
>
  <div class="bg-primary-200 w-fit rounded-full p-4 text-black">
    <svelte:component this={activity.icon} size={24} />
  </div>

  <div>
    <p class="text-center text-sm font-medium text-gray-600 dark:text-gray-200 md:text-left">
      {activity.title}
    </p>
    <p class="text-center text-2xl font-bold md:text-left">
      {activity.percentage}
      {#if !activity.hidePercentage}
        %
      {/if}
    </p>
    <p class="text-center text-xs text-gray-500 dark:text-gray-300 md:text-left md:text-sm">
      {activity.description}
    </p>
  </div>
</div>
