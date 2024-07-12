<script>
  import PathwayEmptyIcon from '$lib/components/Icons/PathwayEmptyIcon.svelte';
  import Box from '$lib/components/Box/index.svelte';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import { currentOrgPath } from '$lib/utils/store/org';
  import { goto } from '$app/navigation';
  import { VARIANTS } from '$lib/components/PrimaryButton/constants';
  import PathwayCard from './PathwayCard.svelte';
  import { courseMetaDeta } from '$lib/components/Courses/store';
  import {
    StructuredList,
    StructuredListBody,
    StructuredListCell,
    StructuredListHead,
    StructuredListRow
  } from 'carbon-components-svelte';
  import { t } from '$lib/utils/functions/translations';
  import PathwayList from './PathwayList.svelte';

  export let pathways;

  const openNewPathwayModal = () => {
    goto($currentOrgPath + '/pathway?new_pathway=true');
  };
</script>

<div>
  {#if pathways.length}
    {#if $courseMetaDeta.view === 'list'}
      <StructuredList selection class="w-full">
        <StructuredListHead>
          <StructuredListRow head>
            <StructuredListCell head>
              {$t('courses.course_card.list_view.title')}
            </StructuredListCell>
            <StructuredListCell head>
              {$t('courses.course_card.list_view.description')}
            </StructuredListCell>
            <StructuredListCell head>Courses</StructuredListCell>
            <StructuredListCell head>
              {$t('courses.course_card.list_view.students')}
            </StructuredListCell>
            <StructuredListCell head>
              {$t('courses.course_card.list_view.published')}
            </StructuredListCell>
            <StructuredListCell head>{''}</StructuredListCell>
          </StructuredListRow>
        </StructuredListHead>
        <StructuredListBody>
          {#each pathways as pathway}
            <PathwayList />
          {/each}
        </StructuredListBody>
      </StructuredList>
    {:else}
      <div class="grid grid-cols-2 gap-4">
        {#each pathways as pathway}
          <PathwayCard />
        {/each}
      </div>
    {/if}
  {:else}
    <Box className="w-full">
      <PathwayEmptyIcon />
      <h3 class="dark:text-white text-2xl my-5">No Learning path yet</h3>
      <p class="dark:text-white w-1/3 text-center mb-5">
        Add a group of related courses to set students on a path to excellence in your fields
      </p>
      <PrimaryButton
        variant={VARIANTS.OUTLINED}
        className="font-normal text-sm px-4 w-fit"
        onClick={openNewPathwayModal}
      >
        Create collection
      </PrimaryButton>
    </Box>
  {/if}
</div>
