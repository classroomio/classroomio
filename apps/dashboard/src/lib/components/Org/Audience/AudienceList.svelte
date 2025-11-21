<script lang="ts">
  import { Input } from '@cio/ui/base/input';
  import * as Table from '@cio/ui/base/table';
  import { page as pageStore } from '$app/state';
  import Search from '@lucide/svelte/icons/search';
  import { Skeleton } from '@cio/ui/base/skeleton';
  import * as Pagination from '@cio/ui/base/pagination';

  import { t } from '$lib/utils/functions/translations';
  import { currentOrg, orgAudience } from '$lib/utils/store/org';

  import Avatar from '$lib/components/Avatar/index.svelte';
  interface Props {
    isLoading?: boolean;
  }

  let { isLoading = false }: Props = $props();

  const headers = [
    { key: 'name', value: $t('audience.name') },
    { key: 'email', value: $t('audience.email') },
    { key: 'date_joined', value: $t('audience.date_joined') }
  ];
  let pageSize = $state(5);
  let currentPage = $state(1);
  let searchValue = $state('');

  const filteredRows = $derived(
    searchValue
      ? $orgAudience.filter((row) =>
          Object.values(row).some((val) => String(val).toLowerCase().includes(searchValue.toLowerCase()))
        )
      : $orgAudience
  );

  const totalPages = $derived(Math.ceil(filteredRows.length / pageSize));
  const startIndex = $derived((currentPage - 1) * pageSize);
  const endIndex = $derived(startIndex + pageSize);
  const paginatedRows = $derived(filteredRows.slice(startIndex, endIndex));

  $effect(() => {
    if (filteredRows.length > 0 && currentPage > totalPages) {
      currentPage = 1;
    }
  });
</script>

<div class="w-full space-y-4">
  <!-- Search Toolbar -->
  <div class="flex items-center gap-2">
    <div class="relative flex-1">
      <Search class="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
      <Input type="text" placeholder="Search..." bind:value={searchValue} />
    </div>
  </div>

  <!-- Table -->
  {#if isLoading}
    <div class="space-y-2">
      {#each Array(pageSize) as _}
        <Skeleton class="h-12 w-full" />
      {/each}
    </div>
  {:else}
    <div class="rounded-md border">
      <Table.Root>
        <Table.Header>
          <Table.Row>
            {#each headers as header}
              <Table.Head>{header.value}</Table.Head>
            {/each}
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {#each paginatedRows as row}
            <Table.Row>
              <Table.Cell>
                <a
                  href={`${pageStore.url.href}/${row.id}/${$currentOrg.id}`}
                  class="text-primary-700 flex items-center gap-2 hover:underline"
                >
                  <Avatar src={row.avatar_url} width="w-5" height="h-5" />
                  {row.name}
                </a>
              </Table.Cell>
              <Table.Cell>{row.email}</Table.Cell>
              <Table.Cell>{row.date_joined}</Table.Cell>
            </Table.Row>
          {/each}
        </Table.Body>
      </Table.Root>
    </div>
  {/if}

  <!-- Pagination -->
  <div class="flex items-center justify-between">
    <Pagination.Root
      count={filteredRows.length}
      perPage={pageSize}
      page={currentPage}
      onPageChange={(page) => (currentPage = page)}
    >
      {#snippet children({ pages, currentPage: activePage })}
        <Pagination.Content>
          <Pagination.Item>
            <Pagination.PrevButton />
          </Pagination.Item>
          {#each pages as page (page.key)}
            {#if page.type === 'ellipsis'}
              <Pagination.Item>
                <Pagination.Ellipsis />
              </Pagination.Item>
            {:else}
              <Pagination.Item>
                <Pagination.Link {page} isActive={activePage === page.value}>
                  {page.value}
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
</div>
