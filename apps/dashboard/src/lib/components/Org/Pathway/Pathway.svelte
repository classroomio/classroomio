<script lang="ts">
  import { goto } from '$app/navigation';
  import Box from '$lib/components/Box/index.svelte';
  import PathwayEmptyIcon from '$lib/components/Icons/PathwayEmptyIcon.svelte';
  import PathwayCard from '$lib/components/Org/Pathway/PathwayCard.svelte';
  import PathwayCardLoader from '$lib/components/Org/Pathway/PathwayCardLoader.svelte';
  import PathwayList from '$lib/components/Org/Pathway/PathwayList.svelte';
  import { pathwayMetaData } from '$lib/components/Org/Pathway/store';
  import { VARIANTS } from '$lib/components/PrimaryButton/constants';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import { t } from '$lib/utils/functions/translations';
  import { currentOrgPath } from '$lib/utils/store/org';
  import { isMobile } from '$lib/utils/store/useMobile';
  import type { Pathway } from '$lib/utils/types';
  import {
    StructuredList,
    StructuredListBody,
    StructuredListCell,
    StructuredListHead,
    StructuredListRow
  } from 'carbon-components-svelte';

  export let pathways: Pathway[] = [];
  export let searching: boolean = false;

  const openNewPathwayModal = () => {
    goto($currentOrgPath + '/pathways?new_pathway=true');
  };
</script>

<div class="h-full w-full">
  {#if $pathwayMetaData.isLoading}
    <section class="grid gap-4 md:grid-cols-2">
      <PathwayCardLoader />
      <PathwayCardLoader />
      <PathwayCardLoader />
    </section>
  {:else if $pathwayMetaData.view === 'list'}
    <StructuredList selection class="w-full">
      <StructuredListHead>
        <StructuredListRow head>
          <StructuredListCell head>
            {$t('pathway.pathway_card.list_view.title')}
          </StructuredListCell>
          <StructuredListCell head>
            {$t('pathway.pathway_card.list_view.description')}
          </StructuredListCell>
          {#if !$isMobile}
            <StructuredListCell head>
              {$t('pathway.pathway_card.list_view.courses')}</StructuredListCell
            >
            <StructuredListCell head>
              {$t('pathway.pathway_card.list_view.students')}
            </StructuredListCell>
            <StructuredListCell head>
              {$t('pathway.pathway_card.list_view.published')}
            </StructuredListCell>
          {/if}
          <StructuredListCell head>{''}</StructuredListCell>
        </StructuredListRow>
      </StructuredListHead>
      <StructuredListBody>
        {#each pathways as pathway}
          <PathwayList
            id={pathway.id}
            title={pathway.title}
            description={pathway.description}
            isPublished={pathway.is_published}
            totalCourse={pathway.total_course}
            totalStudents={pathway.total_students}
          />
        {/each}
      </StructuredListBody>
    </StructuredList>
  {:else}
    <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
      {#each pathways as pathway}
        <PathwayCard
          id={pathway.id}
          title={pathway.title}
          description={pathway.description}
          bannerImage={pathway.logo}
          isPublished={pathway.is_published}
          totalCourse={pathway.total_course}
        />
      {/each}
    </div>
  {/if}

  {#if !$pathwayMetaData.isLoading && !pathways.length}
    <Box className="w-full">
      <PathwayEmptyIcon />
      {#if searching}
        <h3 class="my-5 text-2xl dark:text-white">{$t('search.no_pathway')}</h3>
      {:else}
        <h3 class="my-5 text-2xl dark:text-white">{$t('pathway.empty_title')}</h3>
        <p class="mb-5 w-1/3 text-center dark:text-white">
          {$t('pathway.empty_description')}
        </p>
        <PrimaryButton
          variant={VARIANTS.OUTLINED}
          className="font-normal text-sm px-4 w-fit"
          onClick={openNewPathwayModal}
        >
          {$t('pathway.heading_button')}
        </PrimaryButton>
      {/if}
    </Box>
  {/if}
</div>
