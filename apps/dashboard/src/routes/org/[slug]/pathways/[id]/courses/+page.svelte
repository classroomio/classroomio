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
  import Grid from 'carbon-icons-svelte/lib/Grid.svelte';
  import List from 'carbon-icons-svelte/lib/List.svelte';

  import IconButton from '$lib/components/IconButton/index.svelte';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import RoleBasedSecurity from '$lib/components/RoleBasedSecurity/index.svelte';
  import CourseCard from '$lib/components/Pathways/CourseCard.svelte';
  import { collection } from '../store';
  import { isMobile } from '$lib/utils/store/useMobile';
  import { Add } from 'carbon-icons-svelte';

  let searchValue: string = '';
  let selectedId: string = '1';
  let coursePreference: string = 'grid';

  const setViewPreference = (preference: 'grid' | 'list') => {
    coursePreference = preference;
    localStorage.setItem('pathwayCourseView', coursePreference);
  };

  // Computed property to filter courses based on the search value
  $: filteredCourses = $collection.courses.filter(
    (course) =>
      course.title.toLowerCase().includes(searchValue.toLowerCase()) &&
      (selectedId === '0' ? course.is_published : !course.is_published)
  );

  $: {
    console.log(selectedId);
  }
</script>

<section class="w-full h-auto max-w-[90%] mx-auto">
  <!-- header -->
  <div class="flex items-center justify-between">
    <h1>Courses</h1>

    <div class="flex gap-4 items-center">
      <RoleBasedSecurity allowedRoles={[1, 2]}>
        {#if $isMobile}
          <PrimaryButton onClick={() => console.log('Add Course')}>
            <Add size={24} />
          </PrimaryButton>
        {:else}
          <PrimaryButton label="Add Course" onClick={() => console.log('Add Course')} />
        {/if}
      </RoleBasedSecurity>
      <OverflowMenu flipped>
        <OverflowMenuItem text="Add / remove course" />
        <OverflowMenuItem text="Order Courses" />
        <OverflowMenuItem text="Publish collection" />
      </OverflowMenu>
    </div>
  </div>

  <!-- filter container -->
  <div class="filter-containter flex items-end justify-end gap-2 mt-3">
    <Search
      placeholder="Find Learning Path"
      bind:value={searchValue}
      searchClass="md:w-[30%]"
      class=" bg-gray-100 dark:bg-neutral-800 text-sm"
    />
    <Dropdown
      class="h-[3rem]"
      bind:selectedId
      items={[
        { id: '0', text: 'Published' },
        { id: '1', text: 'UnPublished' }
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
              <StructuredListCell head>Title</StructuredListCell>
              <StructuredListCell head>Description</StructuredListCell>
              <StructuredListCell head>Students</StructuredListCell>
              <StructuredListCell head>Lessons</StructuredListCell>
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
</section>

<style>
  .filter-containter :global(.bx--dropdown) {
    max-height: unset;
    height: 100%;
  }
</style>
