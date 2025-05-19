<script lang="ts">
  import { CourseCard } from '$lib/components/Courses/components/Card';
  import IconButton from '$lib/components/IconButton/index.svelte';
  import CourseIcon from '$lib/components/Icons/CourseIcon.svelte';
  import AddCourseModal from '$lib/components/Pathway/components/AddCourseModal.svelte';
  import PathwayContainer from '$lib/components/Pathway/components/PathwayContainer.svelte';
  import { addCourseModal, pathway, pathwayCourses } from '$lib/components/Pathway/store';
  import { VARIANTS } from '$lib/components/PrimaryButton/constants';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import { RoleBasedSecurity } from '$lib/components/RoleBasedSecurity';
  import { t } from '$lib/utils/functions/translations';
  import { isMobile } from '$lib/utils/store/useMobile';
  import type { PathwayCourse } from '$lib/utils/types';
  import {
    Dropdown,
    OverflowMenu,
    OverflowMenuItem,
    Search,
    StructuredList,
    StructuredListBody,
    StructuredListCell,
    StructuredListHead,
    StructuredListRow
  } from 'carbon-components-svelte';
  import { Add } from 'carbon-icons-svelte';
  import Grid from 'carbon-icons-svelte/lib/Grid.svelte';
  import List from 'carbon-icons-svelte/lib/List.svelte';

  export let data;

  let searchValue: string = '';
  let selectedId: string = '0';
  let filteredCourses: PathwayCourse[] = [];
  let coursePreference: string = 'grid';

  const setViewPreference = (preference: 'grid' | 'list') => {
    coursePreference = preference;
    localStorage.setItem('pathwayCourseView', coursePreference);
  };

  function orderCourses() {
    $addCourseModal.step = 1;
    $addCourseModal.open = true;
  }

  function addCourses() {
    $addCourseModal.open = true;
    $addCourseModal.step = 0;
  }

  function removeCourses() {
    $addCourseModal.open = true;
    $addCourseModal.step = 2;
  }

  // Computed property to filter courses based on the search value
  $: filteredCourses = $pathwayCourses.filter((item) =>
    item.course.title.toLowerCase().includes(searchValue.toLowerCase())
  );
</script>

<PathwayContainer bind:pathwayId={data.pathwayId}>
  <div class="mx-auto max-w-6xl pt-4">
    <AddCourseModal pathwayId={$pathway.id} />

    <!-- header -->
    <div class="mx-auto flex max-w-[95%] items-center justify-between">
      <h1 class="text-3xl">{$t('pathway.pages.course.title')}</h1>

      <div class="flex justify-end gap-5">
        <RoleBasedSecurity allowedRoles={[1, 2]}>
          {#if $isMobile}
            <PrimaryButton onClick={addCourses}>
              <Add size={24} />
            </PrimaryButton>
          {:else}
            <PrimaryButton label={$t('pathway.pages.course.add_course')} onClick={addCourses} />
          {/if}
        </RoleBasedSecurity>
        <OverflowMenu flipped>
          <OverflowMenuItem text={$t('pathway.pages.course.add_remove')} on:click={removeCourses} />
          <OverflowMenuItem text={$t('pathway.pages.course.order')} on:click={orderCourses} />
          <OverflowMenuItem
            text={$t('pathway.pages.course.publish')}
            on:click={() => ($pathway.is_published = true)}
          />
        </OverflowMenu>
      </div>
    </div>

    <!-- filter container -->
    <div class="filter-containter mx-auto flex max-w-[90%] justify-end gap-2 py-5">
      <Search
        placeholder={$t('pathway.pages.course.search')}
        bind:value={searchValue}
        searchClass="md:w-[30%]"
        class=" bg-gray-100 text-sm dark:bg-neutral-800"
      />
      <Dropdown
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
    <div class="px-16">
      {#if $pathwayCourses.length > 0}
        {#if coursePreference === 'list'}
          <div class="overflow-x-auto border">
            <StructuredList>
              <StructuredListHead>
                <StructuredListRow head>
                  <StructuredListCell head>
                    {$t('pathway.pages.course.body_title')}
                  </StructuredListCell>
                  <StructuredListCell head>
                    {$t('pathway.pages.course.description')}
                  </StructuredListCell>
                  <StructuredListCell head>
                    {$t('pathway.pages.course.students')}
                  </StructuredListCell>
                  <StructuredListCell head>{$t('pathway.pages.course.lessons')}</StructuredListCell>
                </StructuredListRow>
              </StructuredListHead>
              <StructuredListBody>
                {#each filteredCourses as course}
                  <StructuredListRow>
                    <StructuredListCell noWrap>
                      <p class="font-semibold text-black dark:text-white">
                        {course.course.title}
                      </p>
                    </StructuredListCell>
                    <StructuredListCell>{course.course.description}</StructuredListCell>
                    <StructuredListCell>
                      {course.course.group_id?.groupmember?.length}
                    </StructuredListCell>
                    <StructuredListCell>
                      {course.course.lesson?.length}
                    </StructuredListCell>
                  </StructuredListRow>
                {/each}
              </StructuredListBody>
            </StructuredList>
          </div>
        {:else if coursePreference === 'grid'}
          <section class="flex flex-wrap items-center gap-10 md:gap-6">
            {#each filteredCourses as course}
              <CourseCard
                bannerImage={course.course.logo || '/images/classroomio-course-img-template.jpg'}
                description={course.course.description}
                id={course.course.id}
                isPublished={course.course.is_published}
                title={course.course.title}
                totalLessons={course.course.lesson?.length || 0}
                totalStudents={course.course.group_id?.groupmember?.length || 0}
                type={course.course.type}
                pathwayId={$pathway.id}
              />
            {/each}
          </section>
        {/if}
      {:else}
        <!-- empty course state -->
        <div
          class="mx-auto mt-5 flex h-[60vh] max-w-[90%] flex-col items-center justify-center gap-3 rounded-md border px-10 text-center"
        >
          <div class="scale-[5]">
            <CourseIcon color="#0233BD" />
          </div>
          <span class="mt-10 text-lg font-medium"
            >{$t('pathway.pages.course.empty_state_header')}</span
          >
          <p>{$t('pathway.pages.course.empty_state_text')}</p>

          <div class="flex justify-center">
            <PrimaryButton
              variant={VARIANTS.OUTLINED}
              label={$t('pathway.pages.course.empty_state_label')}
              onClick={() => ($addCourseModal.open = true)}
            />
          </div>
        </div>
      {/if}
    </div>
  </div>
</PathwayContainer>

<style>
  .filter-containter :global(.bx--dropdown) {
    max-height: unset;
    height: 100%;
  }
</style>
