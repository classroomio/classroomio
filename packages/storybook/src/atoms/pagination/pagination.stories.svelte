<script module>
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import * as Pagination from '@cio/ui/base/pagination';

  const { Story } = defineMeta({
    title: 'Atom/Pagination',
    component: Pagination.Root,
    parameters: {
      layout: 'centered'
    },
    tags: ['autodocs']
  });
</script>

<script>
  let page = $state(1);
</script>

<Story name="Default">
  {#snippet template()}
    <Pagination.Root count={100} perPage={10} bind:page>
      <Pagination.Content>
        <Pagination.Item>
          <Pagination.PrevButton />
        </Pagination.Item>
        {#each Array.from({ length: 10 }, (_, i) => i + 1) as pageNum}
          <Pagination.Item>
            <Pagination.Link page={pageNum} isActive={pageNum === page}>
              {pageNum}
            </Pagination.Link>
          </Pagination.Item>
        {/each}
        <Pagination.Item>
          <Pagination.NextButton />
        </Pagination.Item>
      </Pagination.Content>
    </Pagination.Root>
  {/snippet}
</Story>

<Story name="With Ellipsis">
  {#snippet template()}
    <Pagination.Root count={500} perPage={10} bind:page>
      <Pagination.Content>
        <Pagination.Item>
          <Pagination.PrevButton />
        </Pagination.Item>
        <Pagination.Item>
          <Pagination.Link page={1} isActive={page === 1}>1</Pagination.Link>
        </Pagination.Item>
        <Pagination.Item>
          <Pagination.Ellipsis />
        </Pagination.Item>
        <Pagination.Item>
          <Pagination.Link {page} isActive={true}>{page}</Pagination.Link>
        </Pagination.Item>
        <Pagination.Item>
          <Pagination.Ellipsis />
        </Pagination.Item>
        <Pagination.Item>
          <Pagination.Link page={50}>50</Pagination.Link>
        </Pagination.Item>
        <Pagination.Item>
          <Pagination.NextButton />
        </Pagination.Item>
      </Pagination.Content>
    </Pagination.Root>
  {/snippet}
</Story>
