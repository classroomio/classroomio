<script lang="ts">
  import * as Table from '@cio/ui/base/table';
  import { page as pageStore } from '$app/state';
  import { Skeleton } from '@cio/ui/base/skeleton';
  import { Search } from '@cio/ui/custom/search';
  import * as Pagination from '@cio/ui/base/pagination';
  import UsersIcon from '@lucide/svelte/icons/users';
  import { orgApi } from '$features/org/api/org.svelte';
  import { t } from '$lib/utils/functions/translations';
  import { Empty } from '@cio/ui/custom/empty';
  import { UpgradeBanner } from '$features/ui';
  import { currentOrgMaxAudience } from '$lib/utils/store/org';
  import * as Avatar from '@cio/ui/base/avatar';
  import * as Page from '@cio/ui/base/page';
  import { shortenName } from '$lib/utils/functions/string';
  import type { OrganizationAudience } from '$features/org/utils/types';

  interface Props {
    audience?: OrganizationAudience;
  }

  let { audience }: Props = $props();

  // Initialize audience from prop if provided
  $effect(() => {
    if (audience) {
      orgApi.audience = audience;
    }
  });

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
      ? orgApi.audience.filter((row) =>
          Object.values(row).some((val) => String(val).toLowerCase().includes(searchValue.toLowerCase()))
        )
      : orgApi.audience
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

{#if orgApi.audience.length >= $currentOrgMaxAudience}
  <UpgradeBanner>{$t('audience.upgrade')}</UpgradeBanner>
{/if}

<Page.BodyHeader>
  <Search placeholder="Search..." bind:value={searchValue} class="" />
</Page.BodyHeader>

{#if orgApi.audience.length || orgApi.isLoading}
  <div class="w-full space-y-4">
    <!-- Table -->
    {#if orgApi.isLoading}
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
                    href={`${pageStore.url.href}/${row.id}`}
                    class="ui:text-primary flex items-center gap-2 hover:underline"
                  >
                    <Avatar.Root class="h-5 w-5">
                      <Avatar.Image
                        src={row.avatarUrl ? row.avatarUrl : '/logo-192.png'}
                        alt={row.name ? row.name : 'User'}
                      />
                      <Avatar.Fallback>{shortenName(row.name) || 'U'}</Avatar.Fallback>
                    </Avatar.Root>
                    {row.name}
                  </a>
                </Table.Cell>
                <Table.Cell>{row.email}</Table.Cell>
                <Table.Cell>{row.createdAt}</Table.Cell>
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
{:else}
  <Empty title={$t('audience.no_audience')} description={$t('audience.manage')} icon={UsersIcon} variant="page" />
{/if}
