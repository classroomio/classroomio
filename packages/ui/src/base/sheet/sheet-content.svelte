<script lang="ts" module>
  import { tv, type VariantProps } from 'tailwind-variants';
  export const sheetVariants = tv({
<<<<<<< HEAD
    base: 'bg-background data-[state=open]:animate-in data-[state=closed]:animate-out fixed z-50 flex flex-col gap-4 shadow-lg transition ease-in-out data-[state=closed]:duration-300 data-[state=open]:duration-500',
    variants: {
      side: {
        top: 'data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top inset-x-0 top-0 h-auto border-b',
        bottom:
          'data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom inset-x-0 bottom-0 h-auto border-t',
        left: 'data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left inset-y-0 left-0 h-full w-3/4 border-r sm:max-w-sm',
        right:
          'data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right inset-y-0 right-0 h-full w-3/4 border-l sm:max-w-sm'
=======
    base: 'ui:bg-background ui:data-[state=open]:animate-in ui:data-[state=closed]:animate-out ui:fixed ui:z-50 ui:flex ui:flex-col ui:gap-4 ui:shadow-lg ui:transition ui:ease-in-out ui:data-[state=closed]:duration-300 ui:data-[state=open]:duration-500',
    variants: {
      side: {
        top: 'ui:data-[state=closed]:slide-out-to-top ui:data-[state=open]:slide-in-from-top ui:inset-x-0 ui:top-0 ui:h-auto ui:border-b',
        bottom:
          'ui:data-[state=closed]:slide-out-to-bottom ui:data-[state=open]:slide-in-from-bottom ui:inset-x-0 ui:bottom-0 ui:h-auto ui:border-t',
        left: 'ui:data-[state=closed]:slide-out-to-left ui:data-[state=open]:slide-in-from-left ui:inset-y-0 ui:left-0 ui:h-full ui:w-3/4 ui:border-r ui:sm:max-w-sm',
        right:
          'ui:data-[state=closed]:slide-out-to-right ui:data-[state=open]:slide-in-from-right ui:inset-y-0 ui:right-0 ui:h-full ui:w-3/4 ui:border-l ui:sm:max-w-sm'
>>>>>>> feat/release-v2
      }
    },
    defaultVariants: {
      side: 'right'
    }
  });

  export type Side = VariantProps<typeof sheetVariants>['side'];
</script>

<script lang="ts">
  import { Dialog as SheetPrimitive } from 'bits-ui';
  import XIcon from '@lucide/svelte/icons/x';
  import type { Snippet } from 'svelte';
  import SheetOverlay from './sheet-overlay.svelte';
  import { cn, type WithoutChildrenOrChild } from '../../../src/tools';

  let {
    ref = $bindable(null),
    class: className,
    side = 'right',
    portalProps,
    children,
    ...restProps
  }: WithoutChildrenOrChild<SheetPrimitive.ContentProps> & {
    portalProps?: SheetPrimitive.PortalProps;
    side?: Side;
    children: Snippet;
  } = $props();
</script>

<SheetPrimitive.Portal {...portalProps}>
  <SheetOverlay />
  <SheetPrimitive.Content
    bind:ref
    data-slot="sheet-content"
    class={cn(sheetVariants({ side }), className)}
    {...restProps}
  >
    {@render children?.()}
    <SheetPrimitive.Close
<<<<<<< HEAD
      class="ring-offset-background focus-visible:ring-ring rounded-xs focus-visible:outline-hidden absolute right-4 top-4 opacity-70 transition-opacity hover:opacity-100 focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none"
    >
      <XIcon class="size-4" />
=======
      class="ui:ring-offset-background ui:focus-visible:ring-ring ui:rounded-xs ui:focus-visible:outline-hidden ui:absolute ui:right-4 ui:top-4 ui:opacity-70 ui:transition-opacity ui:hover:opacity-100 ui:focus-visible:ring-2 ui:focus-visible:ring-offset-2 ui:disabled:pointer-events-none"
    >
      <XIcon class="ui:size-4" />
>>>>>>> feat/release-v2
      <span class="sr-only">Close</span>
    </SheetPrimitive.Close>
  </SheetPrimitive.Content>
</SheetPrimitive.Portal>
