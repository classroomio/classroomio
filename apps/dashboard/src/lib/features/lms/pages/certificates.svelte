<script lang="ts">
  import { onDestroy } from 'svelte';
  import { Button } from '@cio/ui/base/button';
  import { Empty } from '@cio/ui/custom/empty';
  import { Search } from '@cio/ui/custom/search';
  import { CourseCardLoader } from '$features/course/components';
  import { TablePagination } from '$features/ui';
  import { currentOrg } from '$lib/utils/store/org';
  import { t } from '$lib/utils/functions/translations';
  import { DebouncedSearch } from '$lib/utils/functions/debounced-search.svelte';
  import { earnedCertificatesApi } from '../api';
  import EarnedCertificateCard from '../components/earned-certificate-card.svelte';

  const PAGE_SIZE = 12;

  let currentPage = $state(1);
  let loadedOrgId = '';

  const search = new DebouncedSearch({
    onApply: () => {
      currentPage = 1;
      loadCertificates();
    }
  });

  const certificates = $derived(earnedCertificatesApi.items);
  const totalCertificates = $derived(earnedCertificatesApi.pagination?.total ?? 0);
  const hasSearch = $derived(search.applied !== '');

  function loadCertificates() {
    void earnedCertificatesApi.fetchCertificates({
      page: currentPage,
      limit: PAGE_SIZE,
      search: search.applied || undefined
    });
  }

  function handlePageChange(nextPage: number) {
    currentPage = nextPage;
    loadCertificates();
  }

  $effect(() => {
    const organizationId = $currentOrg.id;
    if (!organizationId || organizationId === loadedOrgId) return;

    loadedOrgId = organizationId;
    currentPage = 1;
    loadCertificates();
  });

  onDestroy(() => {
    search.destroy();
  });
</script>

<div class="space-y-4">
  <Search
    value={search.draft}
    onValueChange={(nextValue) => search.input(nextValue)}
    placeholder={$t('certificates.search')}
  />

  {#if !certificates}
    <div class="grid w-full grid-cols-1 justify-items-center gap-4 md:grid-cols-2 xl:grid-cols-3">
      {#each [0, 1, 2] as index (index)}
        <CourseCardLoader />
      {/each}
    </div>
  {:else if certificates.length === 0}
    <Empty
      title={hasSearch ? $t('certificates.no_results_title') : $t('certificates.empty_title')}
      description={hasSearch ? $t('certificates.no_results_description') : $t('certificates.empty_description')}
    >
      {#if !hasSearch}
        <Button href="/lms/mylearning">{$t('certificates.go_to_my_learning')}</Button>
      {/if}
    </Empty>
  {:else}
    <div class="grid w-full grid-cols-1 justify-items-center gap-4 md:grid-cols-2 xl:grid-cols-3">
      {#each certificates as certificate (`${certificate.kind}:${certificate.data.id}`)}
        <EarnedCertificateCard {certificate} />
      {/each}
    </div>

    {#if totalCertificates > PAGE_SIZE}
      <TablePagination
        count={totalCertificates}
        perPage={PAGE_SIZE}
        page={currentPage}
        onPageChange={handlePageChange}
      />
    {/if}
  {/if}
</div>
