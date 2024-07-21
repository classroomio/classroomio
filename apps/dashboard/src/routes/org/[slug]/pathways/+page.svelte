<script lang="ts">
  import { Search, Dropdown } from 'carbon-components-svelte';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import { Add } from 'carbon-icons-svelte';
  import { isMobile } from '$lib/utils/store/useMobile';
  import { currentOrg, currentOrgPath, isOrgAdmin } from '$lib/utils/store/org';
  import { t } from '$lib/utils/functions/translations';
  import { VARIANTS } from '$lib/components/PrimaryButton/constants';
  import IconButton from '$lib/components/IconButton/index.svelte';
  import Grid from 'carbon-icons-svelte/lib/Grid.svelte';
  import List from 'carbon-icons-svelte/lib/List.svelte';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import NewPathwayModal from '$lib/components/Org/PathWay/NewPathwayModal.svelte';
  import Pathways from '$lib/components/Org/PathWay/Pathway.svelte';
  import type { Pathway } from '$lib/utils/types';
  import { pathwayMetaDeta, pathways } from '$lib/components/Org/PathWay/store';
  import { fetchPathways } from '$lib/components/Org/PathWay/api';
  import { profile } from '$lib/utils/store/user';
  import { browser } from '$app/environment';

  export let data;

  let { cantFetch } = data;
  let searchValue = '';
  let selectedId: string = '0';
  let hasFetched = false;
  let filteredPathway: Pathway[] = [];
  let searching = false;

  async function getPathway(userId: string | undefined, orgId: string) {
    if (cantFetch && typeof cantFetch === 'boolean' && orgId && !hasFetched) {
      // only show is loading when fetching for the first time
      if (!$pathways.length) {
        $pathwayMetaDeta.isLoading = true;
      }

      const pathwayResult = await fetchPathways(userId, orgId);
      console.log(`pathwayResult`, pathwayResult);

      $pathwayMetaDeta.isLoading = false;
      if (!pathwayResult) return;

      // organizationId = pathwayResult.organizationId;
      pathways.set(pathwayResult.allPathways);
      hasFetched = true;
    }
  }

  function filterPathways(searchValue: string, _selectedId: string, pathways: Pathway[]) {
    if (browser) {
      if (!selectedId) {
        selectedId = localStorage.getItem('classroomio_filter_pathway_key') || '0';
      } else {
        localStorage.setItem('classroomio_filter_pathway_key', _selectedId);
      }
    }

    filteredPathway = pathways.filter((pathway) => {
      if (!searchValue || pathway.title.toLowerCase().includes(searchValue.toLowerCase())) {
        return true;
      }
      searching = true;
      return false;
    });

    if (_selectedId === '0') {
      filteredPathway = filteredPathway.sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
    } else if (_selectedId === '1') {
      filteredPathway = filteredPathway.sort((a, b) => b.is_published - a.is_published);
    } else if (_selectedId === '2') {
      filteredPathway = filteredPathway.sort((a, b) => b.total_course - a.total_course);
    }
  }

  const setViewPreference = (preference: 'grid' | 'list') => {
    $pathwayMetaDeta.view = preference;
    localStorage.setItem('pathwayView', preference);
  };

  const openNewPathwayModal = () => {
    goto($currentOrgPath + '/pathways?new_pathway=true');
  };

  onMount(() => {
    const pathwayView = localStorage.getItem('pathwayView') as 'grid' | 'list' | null;

    if (pathwayView) {
      $pathwayMetaDeta.view = pathwayView;
    }
  });

  $: filterPathways(searchValue, selectedId, $pathways);
  $: getPathway($profile.id, $currentOrg.id);
</script>

<svelte:head>
  <title>Pathways - ClassroomIO</title>
</svelte:head>

<section class="w-full md:max-w-6xl md:mx-auto">
  <div class="py-2 md:py-5 px-2 md:px-5">
    <div class="flex items-center justify-between mb-5">
      <h1 class="dark:text-white text-2xl md:text-3xl font-bold">{$t('pathway.heading')}</h1>
      {#if $isMobile}
        <PrimaryButton isDisabled={!$isOrgAdmin} onClick={openNewPathwayModal}>
          <Add size={24} />
        </PrimaryButton>
      {:else}
        <PrimaryButton
          label={$t('pathway.heading_button')}
          variant={VARIANTS.CONTAINED_DARK}
          isDisabled={!$isOrgAdmin}
          onClick={openNewPathwayModal}
        />
      {/if}
    </div>
    <div class="flex flex-row-reverse mb-5">
      <div class="filter-containter flex items-end justify-start">
        <Search
          placeholder={$t('pathway.search_placeholder')}
          bind:value={searchValue}
          searchClass="mr-2"
          class=" bg-gray-100 dark:bg-neutral-800"
        />
        <Dropdown
          class="h-full min-w-[150px]"
          bind:selectedId
          items={[
            { id: '0', text: $t('pathway.pathway_filter.date_created') },
            { id: '1', text: $t('pathway.pathway_filter.published') },
            { id: '2', text: $t('pathway.pathway_filter.courses') }
          ]}
        />
        {#if $pathwayMetaDeta.view === 'list'}
          <IconButton onClick={() => setViewPreference('grid')}>
            <Grid size={24} />
          </IconButton>
        {:else}
          <IconButton onClick={() => setViewPreference('list')}>
            <List size={24} />
          </IconButton>
        {/if}
      </div>
    </div>

    <NewPathwayModal />
    <Pathways bind:pathways={filteredPathway} {searching} />
  </div>
</section>

<style>
  .filter-containter :global(.bx--dropdown) {
    max-height: unset;
    height: 100%;
  }
</style>
