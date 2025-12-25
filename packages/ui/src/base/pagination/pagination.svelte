<script lang="ts">
  import { Pagination as PaginationPrimitive } from 'bits-ui';

  import { cn } from '../../tools';

  let {
    ref = $bindable(null),
    class: className,
    count = 0,
    perPage = 10,
    page = $bindable(1),
    siblingCount = 1,
    ...restProps
  }: PaginationPrimitive.RootProps = $props();
</script>

<PaginationPrimitive.Root
  bind:ref
  bind:page
  role="navigation"
  aria-label="pagination"
  data-slot="pagination"
  class={cn('ui:mx-auto ui:flex ui:w-full ui:justify-center', className)}
  {count}
  {perPage}
  {siblingCount}
  {...restProps}
/>
