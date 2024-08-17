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
  import { VARIANTS } from '$lib/components/PrimaryButton/constants';
  import { addCourseModal, pathway } from '$lib/components/Pathways/store';

  import CourseIcon from '$lib/components/Icons/CourseIcon.svelte';
  import IconButton from '$lib/components/IconButton/index.svelte';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import Card from '$lib/components/Courses/components/Card/index.svelte';
  import RoleBasedSecurity from '$lib/components/RoleBasedSecurity/index.svelte';
  import AddCourseModal from '$lib/components/Pathways/components/AddCourseModal.svelte';
  import PathwayContainer from '$lib/components/Pathways/components/PathwayContainer.svelte';

  let searchValue: string = '';
  let selectedId: string = '1';
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

  // Computed property to filter courses based on the search value
  $: filteredCourses = $pathway.courses.filter(
    (course) =>
      course.title.toLowerCase().includes(searchValue.toLowerCase()) &&
      (selectedId === '0' ? course.is_published : !course.is_published)
  );
</script>

<PathwayContainer>
  <div class="overflow-y-auto max-h-[90vh]">
    <AddCourseModal />

    <!-- header -->
    <div class="flex justify-between items-center max-w-[95%] mx-auto">
      <h1>{$t('pathway.pages.course.title')}</h1>

      <div class="flex gap-5 justify-end">
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
          <OverflowMenuItem text={$t('pathway.pages.course.add_remove')} on:click={addCourses} />
          <OverflowMenuItem text={$t('pathway.pages.course.order')} on:click={orderCourses} />
          <OverflowMenuItem
            text={$t('pathway.pages.course.publish')}
            on:click={() => ($pathway.is_published = true)}
          />
        </OverflowMenu>
      </div>
    </div>

    <!-- filter container -->
    <div class="filter-containter flex items-end justify-end gap-2 mt-3 max-w-[90%] mx-auto">
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
    <div class="mt-5">
      {#if filteredCourses.length > 0}
        {#if coursePreference === 'list'}
          <div class="max-w overflow-x-auto">
            <StructuredList>
              <StructuredListHead>
                <StructuredListRow head>
                  <StructuredListCell head
                    >{$t('pathway.pages.course.body_title')}</StructuredListCell
                  >
                  <StructuredListCell head
                    >{$t('pathway.pages.course.description')}</StructuredListCell
                  >
                  <StructuredListCell head>{$t('pathway.pages.course.students')}</StructuredListCell
                  >
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
                      {course.total_students}
                    </StructuredListCell>
                    <StructuredListCell>
                      {course.total_lessons}
                    </StructuredListCell>
                  </StructuredListRow>
                {/each}
              </StructuredListBody>
            </StructuredList>
          </div>
        {:else}
          <section class="cards-container">
            {#each filteredCourses as courseData}
              {#key courseData.id}
                <Card
                  bannerImage={courseData.banner_image}
                  id={courseData.id}
                  title={courseData.title}
                  description={courseData.description}
                  totalLessons={courseData.total_lessons}
                  totalStudents={courseData.total_students}
                />
              {/key}
            {/each}
          </section>
        {/if}
      {:else}
        <!-- empty course state -->
        <div
          class="flex flex-col justify-center gap-3 items-center border rounded-md max-w-[90%] mx-auto mt-5 px-10 text-center h-[60vh]"
        >
          <div class="scale-[5]">
            <CourseIcon color="#0233BD" />
          </div>
          <span class="mt-10 font-medium text-lg"
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
