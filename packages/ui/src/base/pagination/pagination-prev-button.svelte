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
<<<<<<< HEAD
  <ChevronLeftIcon class="size-4" />
=======
  <ChevronLeftIcon class="ui:size-4" />
>>>>>>> feat/release-v2
  <span>Previous</span>
{/snippet}

<PaginationPrimitive.PrevButton
  bind:ref
  aria-label="Go to previous page"
  class={cn(
    buttonVariants({
      size: 'default',
      variant: 'ghost',
<<<<<<< HEAD
      class: 'gap-1 px-2.5 sm:pl-2.5'
=======
      class: 'ui:gap-1 ui:px-2.5 ui:sm:pl-2.5'
>>>>>>> feat/release-v2
    }),
    className
  )}
  children={children || Fallback}
  {...restProps}
/>
