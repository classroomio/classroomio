<script lang="ts">
  import { Tabs as TabsPrimitive } from 'bits-ui';
  import { cn } from '../../tools';
  import { receive, send, useUnderlineTabsTrigger } from './underline-tabs-utils.svelte';
  import { box } from 'svelte-toolbelt';

  let {
    ref = $bindable(null),
    value,
    class: className,
    onmouseenter,
    onmouseleave,
    onfocus,
    onblur,
    children,
    ...restProps
  }: TabsPrimitive.TriggerProps = $props();

  const state = useUnderlineTabsTrigger({
    value: box.with(() => value),
    onmouseenter: box.with(() => onmouseenter),
    onmouseleave: box.with(() => onmouseleave),
    onfocus: box.with(() => onfocus),
    onblur: box.with(() => onblur)
  });
</script>

<div class="ui:relative ui:h-full">
  <TabsPrimitive.Trigger
    bind:ref
    data-slot="underline-tabs-trigger"
    class={cn(
      "dark:data-[state=active]:text-foreground data-[state=active]:text-foreground ui:text-foreground ui:z-10 ui:relative ui:inline-flex ui:h-[calc(100%-3px)] ui:flex-1 ui:items-center ui:justify-center ui:gap-1.5 ui:whitespace-nowrap ui:px-3 ui:py-1 ui:text-sm ui:transition-colors ui:focus:outline-none ui:disabled:pointer-events-none ui:disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
      state.rootState.isHovered &&
        state.rootState.hoveredTab === value &&
        'data-[state=inactive]:text-primary-foreground ui:text-primary',
      className
    )}
    {...state.props}
    {...restProps}
  >
    {@render children?.()}
  </TabsPrimitive.Trigger>
  {#if state.rootState.hoveredTab === value}
    <div
      class={cn(
        'ui:bg-primary-foreground ui:z-1 ui:absolute ui:top-0 ui:h-[calc(100%-3px)] ui:w-full ui:rounded-md ui:opacity-0 ui:transition-opacity ui:duration-300 ui:pointer-events-none peer-focus-visible:ui:opacity-100',
        state.rootState.isHovered && 'ui:opacity-100'
      )}
      in:receive={{ key: `${state.rootState.opts.id.current}-tab-hover`, duration: 300 }}
      out:send={{ key: `${state.rootState.opts.id.current}-tab-hover`, duration: 300 }}
    ></div>
  {/if}
  {#if state.rootState.opts.value.current === value}
    <div
      class="ui:bg-primary ui:z-1 ui:absolute ui:-bottom-px ui:h-0.5 ui:w-full ui:pointer-events-none"
      in:receive={{ key: `${state.rootState.opts.id.current}-tab-active-border`, duration: 200 }}
      out:send={{ key: `${state.rootState.opts.id.current}-tab-active-border`, duration: 200 }}
    ></div>
  {/if}
</div>
