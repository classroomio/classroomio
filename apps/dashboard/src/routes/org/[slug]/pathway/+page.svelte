<script lang="ts">
  import { Search, Dropdown } from 'carbon-components-svelte';
  import Box from '$lib/components/Box/index.svelte';
  import NewCourseModal from '$lib/components/Courses/components/NewCourseModal/index.svelte';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import { courseMetaDeta } from '$lib/components/Courses/store';
  import { Add } from 'carbon-icons-svelte';
  import { isMobile } from '$lib/utils/store/useMobile';
  import { isOrgAdmin } from '$lib/utils/store/org';
  import { t } from '$lib/utils/functions/translations';
  import { VARIANTS } from '$lib/components/PrimaryButton/constants';
  import IconButton from '$lib/components/IconButton/index.svelte';
  import Grid from 'carbon-icons-svelte/lib/Grid.svelte';
  import List from 'carbon-icons-svelte/lib/List.svelte';
  import { onMount } from 'svelte';

  import PathwayEmptyIcon from '$lib/components/Icons/PathwayEmptyIcon.svelte';

  export let data;

  let { cantFetch } = data;
  let searchValue = '';
  let selectedId: string = '0';

  const setViewPreference = (preference: 'grid' | 'list') => {
    $courseMetaDeta.view = preference;
    localStorage.setItem('courseView', preference);
  };

  onMount(() => {
    const courseView = localStorage.getItem('courseView') as 'grid' | 'list' | null;

    if (courseView) {
      $courseMetaDeta.view = courseView;
    }
  });
</script>

<svelte:head>
  <title>Collections - ClassroomIO</title>
</svelte:head>

<section class="w-full md:max-w-6xl md:mx-auto">
  <div class="py-2 md:py-10 px-2 md:px-5">
    <div class="flex items-center justify-between mb-5">
      <h1 class="dark:text-white text-2xl md:text-3xl font-bold">Learning Paths</h1>
      {#if $isMobile}
        <PrimaryButton isDisabled={!$isOrgAdmin} onClick={() => console.log('clicked')}>
          <Add size={24} />
        </PrimaryButton>
      {:else}
        <PrimaryButton
          label="Create collection"
          variant={VARIANTS.CONTAINED_DARK}
          isDisabled={!$isOrgAdmin}
          onClick={() => console.log('clicked')}
        />
      {/if}
    </div>
    <div class="flex flex-row-reverse mb-5">
      <div class="filter-containter flex items-end justify-start">
        <Search
          placeholder="Find collection"
          bind:value={searchValue}
          searchClass="mr-2"
          class=" bg-gray-100 dark:bg-neutral-800"
        />
        <Dropdown
          class="h-full"
          bind:selectedId
          items={[
            { id: '0', text: $t('courses.course_filter.date_created') },
            { id: '1', text: $t('courses.course_filter.published') },
            { id: '2', text: $t('courses.course_filter.lessons') }
          ]}
        />
        {#if $courseMetaDeta.view === 'list'}
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

    <NewCourseModal />
    <Box className="w-full">
      <PathwayEmptyIcon />
      <h3 class="dark:text-white text-2xl my-5">No Learning path yet</h3>
      <p class="dark:text-white w-1/3 text-center mb-5">
        Add a group of related courses to set students on a path to excellence in your fields
      </p>
      <PrimaryButton variant={VARIANTS.OUTLINED} className="font-normal text-sm px-4 w-fit">
        Create collection
      </PrimaryButton>
    </Box>
  </div>
</section>

<style>
  .filter-containter :global(.bx--dropdown) {
    max-height: unset;
    height: 100%;
  }
</style>
