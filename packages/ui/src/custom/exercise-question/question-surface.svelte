<script lang="ts">
  import { cn } from '../../tools';

  interface Props {
    class?: string;
    children?: import('svelte').Snippet;
  }

  let { class: className = '', children }: Props = $props();
</script>

<div class={cn('ui:rounded-md ui:border ui:p-4', className)}>
  {@render children?.()}
</div>
