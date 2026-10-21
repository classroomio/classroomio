<script lang="ts">
  import { cn } from '../../tools';

  interface Props {
    path: string;
    class?: string;
  }

  let { path, class: className }: Props = $props();
</script>

<svg viewBox="0 0 24 24" class={cn('ui:size-4', className)} fill="currentColor" aria-hidden="true">
  <path d={path} />
</svg>
