<script lang="ts">
  import { Dialog as DialogPrimitive } from 'bits-ui';
  import type { Snippet } from 'svelte';
  import * as Dialog from './index';
  import { cn, type WithoutChildrenOrChild } from '../../tools';
  import CrossIcon from '@lucide/svelte/icons/x';

  let {
    ref = $bindable(null),
    class: className,
    portalProps,
    children,
    showCloseButton = true,
    ...restProps
  }: WithoutChildrenOrChild<DialogPrimitive.ContentProps> & {
    portalProps?: DialogPrimitive.PortalProps;
    children: Snippet;
    showCloseButton?: boolean;
  } = $props();
</script>

<Dialog.Portal {...portalProps}>
  <Dialog.Overlay />
  <DialogPrimitive.Content
    bind:ref
    data-slot="dialog-content"
    class={cn(
      // `has-[[data-slot=dialog-footer][data-sticky=true]]:pb-0` drops the
      // dialog's own ui:bottom padding when a ui:sticky footer is rendered — // the footer's own `py-4` provides the bottom spacing instead, and
      // it pins flush with the dialog's ui:bottom edge.'ui:bg-background ui:border ui:data-[state=open]:animate-in ui:data-[state=closed]:animate-out ui:data-[state=closed]:fade-out-0 ui:data-[state=open]:fade-in-0 ui:data-[state=closed]:zoom-out-95 ui:data-[state=open]:zoom-in-95 ui:fixed ui:left-[50%] ui:top-[50%] ui:z-200 ui:grid ui:w-full ui:max-w-[calc(100%-2rem)] ui:translate-x-[-50%] ui:translate-y-[-50%] ui:gap-4 ui:rounded-lg ui:p-6 ui:[&:has([data-slot=dialog-footer][data-sticky=true])]:pb-0 ui:shadow-lg ui:duration-200 ui:sm:max-w-lg',
      className
    )}
    {...restProps}
  >
    {@render children?.()}
    {#if showCloseButton}
      <DialogPrimitive.Close
        class="ui:ring-offset-background ui:focus:ring-ring ui:rounded-xs ui:focus:outline-hidden ui:absolute ui:top-4 ui:opacity-70 ui:transition-opacity ui:hover:opacity-100 ui:focus:ring-2 ui:focus:ring-offset-2 ui:disabled:pointer-events-none ui:[&_svg:not([class*='size-'])]:size-4 ui:[&_svg]:pointer-events-none ui:[&_svg]:shrink-0 ui:end-4 ui:cursor-pointer"
      >
        <CrossIcon class="custom" />
        <span class="ui:sr-only">Close</span>
      </DialogPrimitive.Close>
    {/if}
  </DialogPrimitive.Content>
</Dialog.Portal>
