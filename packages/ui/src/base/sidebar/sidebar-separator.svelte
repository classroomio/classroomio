<script lang="ts">
  import { Separator } from '$src/base/separator/index.js';
  import { cn } from '../../tools';
  import type { ComponentProps } from 'svelte';

  let { ref = $bindable(null), class: className, ...restProps }: ComponentProps<typeof Separator> = $props();
</script>

<Separator
  bind:ref
  data-slot="sidebar-separator"
  data-sidebar="separator"
<<<<<<< HEAD
  class={cn('bg-sidebar-border', className)}
=======
  class={cn('ui:bg-sidebar-border', className)}
>>>>>>> feat/release-v2
  {...restProps}
/>
