<script lang="ts" module>
  import { tv, type VariantProps } from 'tailwind-variants';
  export const sheetVariants = tv({
    base: 'ui:bg-background ui:data-[state=open]:animate-in ui:data-[state=closed]:animate-out ui:fixed ui:z-50 ui:flex ui:flex-col ui:gap-4 ui:shadow-lg ui:transition ui:ease-in-out ui:data-[state=closed]:duration-300 ui:data-[state=open]:duration-500',
    variants: {
      side: {
        top: 'ui:data-[state=closed]:slide-out-to-top ui:data-[state=open]:slide-in-from-top ui:inset-x-0 ui:top-0 ui:h-auto ui:border-b',
        bottom:
          'ui:data-[state=closed]:slide-out-to-bottom ui:data-[state=open]:slide-in-from-bottom ui:inset-x-0 ui:bottom-0 ui:h-auto ui:border-t',
        left: 'ui:data-[state=closed]:slide-out-to-left ui:data-[state=open]:slide-in-from-left ui:inset-y-0 ui:left-0 ui:h-full ui:w-3/4 ui:border-r ui:sm:max-w-sm',
        right:
          'ui:data-[state=closed]:slide-out-to-right ui:data-[state=open]:slide-in-from-right ui:inset-y-0 ui:right-0 ui:h-full ui:w-3/4 ui:border-l ui:sm:max-w-sm'
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
      class="ui:ring-offset-background ui:focus-visible:ring-ring ui:rounded-xs ui:focus-visible:outline-hidden ui:absolute ui:right-4 ui:top-4 ui:opacity-70 ui:transition-opacity ui:hover:opacity-100 ui:focus-visible:ring-2 ui:focus-visible:ring-offset-2 ui:disabled:pointer-events-none"
    >
      <XIcon class="ui:size-4" />
      <span class="sr-only">Close</span>
    </SheetPrimitive.Close>
  </SheetPrimitive.Content>
</SheetPrimitive.Portal>
