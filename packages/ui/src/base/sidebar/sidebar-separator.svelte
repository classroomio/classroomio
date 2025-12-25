<script lang="ts">
  import { Separator } from '../separator';
  import { cn } from '../../tools';
  import type { ComponentProps } from 'svelte';

  let { ref = $bindable(null), class: className, ...restProps }: ComponentProps<typeof Separator> = $props();
</script>

<Separator
  bind:ref
  data-slot="sidebar-separator"
  data-sidebar="separator"
  class={cn('ui:bg-sidebar-border', className)}
  {...restProps}
/>
