<script lang="ts">
  import { Pagination as PaginationPrimitive } from 'bits-ui';
  import ChevronLeftIcon from '@lucide/svelte/icons/chevron-left';
  import { cn } from '../../tools';
  import { buttonVariants } from '../button';

  let {
    ref = $bindable(null),
    class: className,
    children,
    ...restProps
  }: PaginationPrimitive.PrevButtonProps = $props();
</script>

{#snippet Fallback()}
  <ChevronLeftIcon class="ui:size-4" />
  <span>Previous</span>
{/snippet}

<PaginationPrimitive.PrevButton
  bind:ref
  aria-label="Go to previous page"
  class={cn(
    buttonVariants({
      size: 'default',
      variant: 'ghost',
      class: 'ui:gap-1 ui:px-2.5 ui:sm:pl-2.5'
    }),
    className
  )}
  children={children || Fallback}
  {...restProps}
/>
