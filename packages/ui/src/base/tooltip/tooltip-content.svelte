<script lang="ts">
  import { Tooltip as TooltipPrimitive } from 'bits-ui';
  import { cn } from '../../tools';

  let {
    ref = $bindable(null),
    class: className,
    sideOffset = 0,
    side = 'top',
    children,
    arrowClasses,
    ...restProps
  }: TooltipPrimitive.ContentProps & {
    arrowClasses?: string;
  } = $props();
</script>

<TooltipPrimitive.Portal>
  <TooltipPrimitive.Content
    bind:ref
    data-slot="tooltip-content"
    {sideOffset}
    {side}
    class={cn(
      'ui:bg-primary ui:text-primary-foreground ui:animate-in ui:fade-in-0 ui:zoom-in-95 ui:data-[state=closed]:animate-out ui:data-[state=closed]:fade-out-0 ui:data-[state=closed]:zoom-out-95 ui:data-[side=bottom]:slide-in-from-top-2 ui:data-[side=left]:slide-in-from-right-2 ui:data-[side=right]:slide-in-from-left-2 ui:data-[side=top]:slide-in-from-bottom-2 ui:origin-(--bits-tooltip-content-transform-origin) ui:z-50 ui:w-fit ui:text-balance ui:rounded-md ui:px-3 ui:py-1.5 ui:text-xs',
      className
    )}
    {...restProps}
  >
    {@render children?.()}
    <TooltipPrimitive.Arrow>
      {#snippet child({ props })}
        <div
          class={cn(
            'ui:bg-primary ui:z-50 ui:size-2.5 ui:rotate-45 ui:rounded-[2px]',
            'ui:data-[side=top]:translate-x-1/2 ui:data-[side=top]:translate-y-[calc(-50%+2px)]',
            'ui:data-[side=bottom]:-translate-x-1/2 ui:data-[side=bottom]:-translate-y-[calc(-50%+1px)]',
            'ui:data-[side=right]:translate-x-[calc(50%+2px)] ui:data-[side=right]:translate-y-1/2',
            'ui:data-[side=left]:-translate-y-[calc(50%-3px)]',
            arrowClasses
          )}
          {...props}
        ></div>
      {/snippet}
    </TooltipPrimitive.Arrow>
  </TooltipPrimitive.Content>
</TooltipPrimitive.Portal>
