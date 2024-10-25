<script>
  import {
    Link,
    DataTable,
    Toolbar,
    ToolbarContent,
    ToolbarSearch,
    Pagination,
    DataTableSkeleton
  } from 'carbon-components-svelte';
  import { page as pageStore } from '$app/stores';
  import { currentOrg, orgAudience } from '$lib/utils/store/org';
  import { t } from '$lib/utils/functions/translations';

  export let isLoading = false;

  const headers = [
    { key: 'name', value: $t('audience.name') },
    { key: 'email', value: $t('audience.email') },
    { key: 'date_joined', value: $t('audience.date_joined') }
  ];
  let pageSize = 5;
  let page = 1;
  let filteredRowIds = [];
  let searchValue = '';
</script>

{#if isLoading}
  <DataTableSkeleton {headers} rows={pageSize} />
{:else}
  <DataTable size="tall" {headers} rows={$orgAudience} {pageSize} {page}>
    <Toolbar>
      <ToolbarContent>
        <ToolbarSearch persistent value={searchValue} shouldFilterRows bind:filteredRowIds />
      </ToolbarContent>
    </Toolbar>
    <svelte:fragment slot="cell-header" let:header>
      {header.value}
    </svelte:fragment>
    <svelte:fragment slot="cell" let:row let:cell>
      <Link
        class="text-black hover:text-black"
        href={`${$pageStore.url.href}/${row.id}/${$currentOrg.id}`}>{cell.value}</Link
      >
    </svelte:fragment>
  </DataTable>
{/if}

<Pagination bind:pageSize bind:page totalItems={filteredRowIds.length} pageSizeInputDisabled />
