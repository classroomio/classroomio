<script lang="ts">
  import { Button } from '$src/base/button/index.js';
  import { cn } from '../../tools';
  import PanelLeftIcon from '@lucide/svelte/icons/panel-left';
  import type { ComponentProps } from 'svelte';
<<<<<<< HEAD
  import { useSidebar } from './context.svelte.js';
=======
  import { useSidebar } from './context.svelte';
>>>>>>> feat/release-v2

  let {
    ref = $bindable(null),
    class: className,
    onclick,
    ...restProps
  }: ComponentProps<typeof Button> & {
    onclick?: (e: MouseEvent) => void;
  } = $props();

  const sidebar = useSidebar();
</script>

<Button
  data-sidebar="trigger"
  data-slot="sidebar-trigger"
  variant="ghost"
  size="icon"
<<<<<<< HEAD
  class={cn('size-7', className)}
=======
  class={cn('ui:size-7', className)}
>>>>>>> feat/release-v2
  type="button"
  onclick={(e) => {
    onclick?.(e);
    sidebar.toggle();
  }}
  {...restProps}
>
  <PanelLeftIcon />
  <span class="sr-only">Toggle Sidebar</span>
</Button>
