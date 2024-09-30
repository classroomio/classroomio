<script>
  import {
    DataTable,
    Toolbar,
    ToolbarContent,
    ToolbarSearch,
    Pagination,
    DataTableSkeleton
  } from 'carbon-components-svelte';
  import { orgAudience } from '$lib/utils/store/org';
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
  </DataTable>
{/if}

<Pagination bind:pageSize bind:page totalItems={filteredRowIds.length} pageSizeInputDisabled />
