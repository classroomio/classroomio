<script lang="ts">
  interface Props {
    className?: string;
    children?: import('svelte').Snippet;
  }

  let { className = '', children }: Props = $props();
</script>

<div
  class="{className} flex h-[517px] w-full flex-col items-center justify-center rounded-sm border border-gray-200 dark:border-neutral-600"
>
  {@render children?.()}
</div>
