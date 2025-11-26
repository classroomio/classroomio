<script lang="ts">
  import { Pagination as PaginationPrimitive } from 'bits-ui';
  import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
  import { cn } from '../../tools';
  import { buttonVariants } from '../button';

  let {
    ref = $bindable(null),
    class: className,
    children,
    ...restProps
  }: PaginationPrimitive.NextButtonProps = $props();
</script>

{#snippet Fallback()}
  <span>Next</span>
<<<<<<< HEAD
  <ChevronRightIcon class="size-4" />
=======
  <ChevronRightIcon class="ui:size-4" />
>>>>>>> feat/release-v2
{/snippet}

<PaginationPrimitive.NextButton
  bind:ref
  aria-label="Go to next page"
  class={cn(
    buttonVariants({
      size: 'default',
      variant: 'ghost',
<<<<<<< HEAD
      class: 'gap-1 px-2.5 sm:pr-2.5'
=======
      class: 'ui:gap-1 ui:px-2.5 ui:sm:pr-2.5'
>>>>>>> feat/release-v2
    }),
    className
  )}
  children={children || Fallback}
  {...restProps}
/>
