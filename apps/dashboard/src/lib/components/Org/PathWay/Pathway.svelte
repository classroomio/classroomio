<script lang="ts">
  import PathwayEmptyIcon from '$lib/components/Icons/PathwayEmptyIcon.svelte';
  import Box from '$lib/components/Box/index.svelte';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import { currentOrgPath } from '$lib/utils/store/org';
  import { goto } from '$app/navigation';
  import { VARIANTS } from '$lib/components/PrimaryButton/constants';
  import CardLoader from '$lib/components/Courses/components/Card/Loader.svelte';
  import PathwayCard from '$lib/components/Org/Pathway/PathwayCard.svelte';
  import {
    StructuredList,
    StructuredListBody,
    StructuredListCell,
    StructuredListHead,
    StructuredListRow
  } from 'carbon-components-svelte';
  import { t } from '$lib/utils/functions/translations';
  import PathwayList from '$lib/components/Org/Pathway/PathwayList.svelte';
  import { isMobile } from '$lib/utils/store/useMobile';
  import type { Pathway } from '$lib/utils/types';
  import { pathwayMetaData } from '$lib/components/Org/Pathway/store';

  export let pathways: Pathway[] = [];
  export let searching: boolean = false;

  const openNewPathwayModal = () => {
    goto($currentOrgPath + '/pathway?new_pathway=true');
  };
</script>

<div class="w-full">
  {#if $pathwayMetaData.isLoading}
    <section class="grid md:grid-cols-2 gap-4">
      <CardLoader />
      <CardLoader />
      <CardLoader />
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
    <div class="grid md:grid-cols-2 gap-4">
      {#each pathways as pathway}
        <PathwayCard
          id={pathway.id}
          title={pathway.title}
          description={pathway.description}
          banner_url={pathway.logo}
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
        <h3 class="dark:text-white text-2xl my-5">{$t('search.no_pathway')}</h3>
      {:else}
        <h3 class="dark:text-white text-2xl my-5">{$t('pathway.empty_title')}</h3>
        <p class="dark:text-white w-1/3 text-center mb-5">
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
