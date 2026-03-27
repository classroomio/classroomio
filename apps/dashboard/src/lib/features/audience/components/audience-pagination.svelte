<script lang="ts">
  import * as Pagination from '@cio/ui/base/pagination';

  interface Props {
    count: number;
    perPage: number;
    page: number;
    onPageChange: (page: number) => void;
  }

  let { count, perPage, page, onPageChange }: Props = $props();
</script>

<div class="flex items-center justify-between">
  <Pagination.Root {count} {perPage} {page} {onPageChange}>
    {#snippet children({ pages, currentPage: activePage })}
      <Pagination.Content>
        <Pagination.Item>
          <Pagination.PrevButton />
        </Pagination.Item>
        {#each pages as pageItem (pageItem.key)}
          {#if pageItem.type === 'ellipsis'}
            <Pagination.Item>
              <Pagination.Ellipsis />
            </Pagination.Item>
          {:else}
            <Pagination.Item>
              <Pagination.Link page={pageItem} isActive={activePage === pageItem.value}>
                {pageItem.value}
              </Pagination.Link>
            </Pagination.Item>
          {/if}
        {/each}
        <Pagination.Item>
          <Pagination.NextButton />
        </Pagination.Item>
      </Pagination.Content>
    {/snippet}
  </Pagination.Root>
</div>
