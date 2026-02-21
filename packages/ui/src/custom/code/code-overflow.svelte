<script lang="ts">
  import Button from '../../base/button/button.svelte';
  import { useCodeOverflow } from './code-utils.svelte';
  import { box } from 'svelte-toolbelt';
  import type { CodeOverflowProps } from './types';
  import { cn } from '../../tools';

  let { collapsed = $bindable(true), class: className, children, ...props }: CodeOverflowProps = $props();

  const state = useCodeOverflow({
    collapsed: box.with(
      () => collapsed,
      (v) => (collapsed = v)
    )
  });
</script>

<div
  {...props}
  data-code-overflow
  data-collapsed={collapsed}
  class={cn('ui:relative ui:overflow-y-hidden ui:data-[collapsed=true]:ui:max-h-[300px]', className)}
>
  {@render children?.()}
  {#if collapsed}
    <div
      class="ui:from-background ui:absolute ui:bottom-0 ui:left-0 ui:z-10 ui:h-full ui:w-full ui:bg-linear-to-t ui:to-transparent"
    ></div>
  {/if}
  {#if collapsed}
    <Button
      variant="secondary"
      size="sm"
      class="ui:absolute ui:bottom-2 ui:left-1/2 ui:z-20 ui:w-fit ui:-translate-x-1/2"
      onclick={state.toggleCollapsed}
    >
      Expand
    </Button>
  {/if}
</div>
