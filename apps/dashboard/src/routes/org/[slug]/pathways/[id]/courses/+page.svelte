<script lang="ts">
  import {
    OverflowMenu,
    OverflowMenuItem,
    Search,
    Dropdown,
    StructuredList,
    StructuredListHead,
    StructuredListRow,
    StructuredListCell,
    StructuredListBody
  } from 'carbon-components-svelte';
  import { Add } from 'carbon-icons-svelte';
  import Grid from 'carbon-icons-svelte/lib/Grid.svelte';
  import List from 'carbon-icons-svelte/lib/List.svelte';

  import { t } from '$lib/utils/functions/translations';
  import { isMobile } from '$lib/utils/store/useMobile';

  import { pathway } from '$lib/components/Pathways/store';
  import IconButton from '$lib/components/IconButton/index.svelte';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import RoleBasedSecurity from '$lib/components/RoleBasedSecurity/index.svelte';
  import CourseCard from '$lib/components/Pathways/components/CourseCard.svelte';
  import PathwayContainer from '$lib/components/Pathways/components/PathwayContainer.svelte';

  let searchValue: string = '';
  let selectedId: string = '1';
  let coursePreference: string = 'grid';

  const setViewPreference = (preference: 'grid' | 'list') => {
    coursePreference = preference;
    localStorage.setItem('pathwayCourseView', coursePreference);
  };

  // Computed property to filter courses based on the search value
  $: filteredCourses = $pathway.courses.filter(
    (course) =>
      course.title.toLowerCase().includes(searchValue.toLowerCase()) &&
      (selectedId === '0' ? course.is_published : !course.is_published)
  );
</script>

<PathwayContainer border={false} maxHeight={false} className="w-full h-auto max-w-[90%] mx-auto">
  <!-- header -->

  <div class="flex items-center justify-between">
    <h1>{$t('pathway.pages.course.title')}</h1>

    <div class="flex gap-5 justify-end">
      <RoleBasedSecurity allowedRoles={[1, 2]}>
        {#if $isMobile}
          <PrimaryButton onClick={() => console.log('Add Course')}>
            <Add size={24} />
          </PrimaryButton>
        {:else}
          <PrimaryButton
            label={$t('pathway.pages.course.add_course')}
            onClick={() => console.log('Add Course')}
          />
        {/if}
      </RoleBasedSecurity>
      <OverflowMenu flipped>
        <OverflowMenuItem text={$t('pathway.pages.course.add_remove')} />
        <OverflowMenuItem text={$t('pathway.pages.course.order')} />
        <OverflowMenuItem text={$t('pathway.pages.course.publish')} />
      </OverflowMenu>
    </div>
  </div>

  <!-- filter container -->
  <div class="filter-containter flex items-end justify-end gap-2 mt-3">
    <Search
      placeholder={$t('pathway.pages.course.search')}
      bind:value={searchValue}
      searchClass="md:w-[30%]"
      class=" bg-gray-100 dark:bg-neutral-800 text-sm"
    />
    <Dropdown
      class="h-[3rem]"
      bind:selectedId
      items={[
        { id: '0', text: $t('pathway.pages.course.option_one') },
        { id: '1', text: $t('pathway.pages.course.option_two') }
      ]}
    />
    {#if coursePreference === 'list'}
      <IconButton onClick={() => setViewPreference('grid')}>
        <Grid size={24} />
      </IconButton>
    {:else}
      <IconButton onClick={() => setViewPreference('list')}>
        <List size={24} />
      </IconButton>
    {/if}
  </div>

  <!-- body -->
  <div>
    {#if coursePreference === 'list'}
      <div class="max-w overflow-x-auto">
        <StructuredList>
          <StructuredListHead>
            <StructuredListRow head>
              <StructuredListCell head>{$t('pathway.pages.course.body_title')}</StructuredListCell>
              <StructuredListCell head>{$t('pathway.pages.course.description')}</StructuredListCell>
              <StructuredListCell head>{$t('pathway.pages.course.students')}</StructuredListCell>
              <StructuredListCell head>{$t('pathway.pages.course.lessons')}</StructuredListCell>
            </StructuredListRow>
          </StructuredListHead>
          <StructuredListBody>
            {#each filteredCourses as course}
              <StructuredListRow>
                <StructuredListCell noWrap
                  ><p class="font-semibold text-black dark:text-white">
                    {course.title}
                  </p></StructuredListCell
                >
                <StructuredListCell>{course.description}</StructuredListCell>
                <StructuredListCell>
                  {course.studentNumber}
                </StructuredListCell>
                <StructuredListCell>
                  {course.lessonNumber}
                </StructuredListCell>
              </StructuredListRow>
            {/each}
          </StructuredListBody>
        </StructuredList>
      </div>
    {:else}
      <section class="flex flex-wrap gap-10 h-full mt-10">
        {#each filteredCourses as course}
          <CourseCard {...course} />
        {/each}
      </section>
    {/if}
  </div>
</PathwayContainer>

<style>
  .filter-containter :global(.bx--dropdown) {
    max-height: unset;
    height: 100%;
  }
</style>
