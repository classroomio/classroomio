<script lang="ts">
  import {
    Search,
    StructuredList,
    StructuredListBody,
    StructuredListCell,
    StructuredListHead,
    StructuredListRow
  } from 'carbon-components-svelte';

  import { VARIANTS } from '$lib/components/PrimaryButton/constants';
  import { t } from '$lib/utils/functions/translations';
  import { fetchCourses } from '$lib/utils/services/courses';
  import { updatePathwayCourses } from '$lib/utils/services/pathways';
  import { currentOrg } from '$lib/utils/store/org';
  import { profile } from '$lib/utils/store/user';
  import type { Course, PathwayCourse } from '$lib/utils/types';
  import { deleteCourse, saveNewPathwayCourses } from '../functions';
  import { addCourseModal, pathwayCourses } from '../store';

  import Checkbox from '$lib/components/Form/Checkbox.svelte';
  import IconButton from '$lib/components/IconButton/index.svelte';
  import Modal from '$lib/components/Modal/index.svelte';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import ArrowLeft from 'carbon-icons-svelte/lib/ArrowLeft.svelte';
  import DragAndDropModal from './DragAndDropModal.svelte';

  export let pathwayId;

  let searchValue = '';
  let isSearchInputOpened = false;
  let allOrgCourses: Course[] = [];
  let courses: Course[] = [];
  let deletedCourses: PathwayCourse[] = [];
  let isLoading: boolean = false;

  function close() {
    $addCourseModal.open = false;
    $addCourseModal.step = 0;
  }

  async function handleSave() {
    isLoading = true;
    // filters out courses that are already in the courses store
    const newPathwayCourses = courses
      .filter((course) => !$pathwayCourses.some((c) => c.course_id === course.id))
      .map((course, index) => ({
        id: '',
        course: course,
        course_id: course.id,
        pathway_id: pathwayId || '',
        order: $pathwayCourses.length + index + 1
      }));

    await saveNewPathwayCourses(newPathwayCourses);

    isLoading = false;
    courses = [];

    // move to the order step
    $addCourseModal.step = 1;
  }

  const handleDelete = async () => {
    await deleteCourse(deletedCourses);
    $addCourseModal.open = false;
  };

  const handleSaveDnD = () => {
    $pathwayCourses.forEach(async (course) => {
      try {
        await updatePathwayCourses(course.id, course.order);
      } catch (error) {
        console.error('Error deleting course from Supabase:', error);
      }
    });

    $addCourseModal.open = false;
  };

  function toggleAddSelection(course: Course, checked: boolean) {
    if (checked) {
      // Avoid duplicating the course
      if (!courses.some((c) => c.id === course.id)) {
        courses = [...courses, course as Course];
      }
    } else {
      courses = courses.filter((c) => c.id !== course.id);
    }
  }

  function toggleDeleteSelection(course: PathwayCourse, checked: boolean) {
    if (checked) {
      // Avoid duplicating the course
      if (!deletedCourses.some((c) => c.course_id === course.course_id)) {
        deletedCourses = [...deletedCourses, course];
      }
    } else {
      deletedCourses = deletedCourses.filter((c) => c.course_id !== course.course_id);
    }
  }

  async function fetchCourse(userId?: string, orgId?: string) {
    const data = await fetchCourses(userId, orgId);
    if (!data) return;

    // shows all the courses that are on the org but not in the pathway
    // this to to be able to display the courses to add to pathway and also for the search filter func
    allOrgCourses = data.allCourses.filter(
      (course) => !$pathwayCourses.some((c) => c.course?.id === course.id)
    );
  }

  $: {
    if ($pathwayCourses) {
      fetchCourse($profile.id, $currentOrg.id);
    }
  }

  // displayed all the courses form line 109 with the filtering option for the searchbar
  $: filteredCourses = searchValue
    ? allOrgCourses.filter((course) =>
        course.title.toLowerCase().includes(searchValue.toLowerCase())
      )
    : allOrgCourses;
</script>

<Modal
  onClose={close}
  bind:open={$addCourseModal.open}
  width="w-3/5"
  modalHeading={$addCourseModal.step === 0
    ? $t('pathway.components.addCourseModal.modal_heading')
    : $t('pathway.components.dragAndDrop.title')}
>
  <slot:fragment slot="headerLeftBtn">
    {#if $addCourseModal.step === 1}
      <IconButton onClick={() => ($addCourseModal.step = 0)}>
        <ArrowLeft class="text-primary-700" />
      </IconButton>
    {/if}
  </slot:fragment>

  <slot:fragment slot="headerRightBtn">
    <Search
      expandable
      bind:expanded={isSearchInputOpened}
      on:expand
      on:collapse
      bind:value={searchValue}
      class="text-white dark:text-black"
    />
  </slot:fragment>

  <main>
    <!-- add course -->
    {#if $addCourseModal.step === 0}
      <div class="max-w overflow-x-auto">
        <StructuredList class="mb-5">
          <StructuredListHead>
            <StructuredListRow head>
              <StructuredListCell head>{$t('pathway.pages.course.body_title')}</StructuredListCell>
              <StructuredListCell head>{$t('pathway.pages.course.description')}</StructuredListCell>
              <StructuredListCell head>{$t('pathway.pages.course.lessons')}</StructuredListCell>
              <StructuredListCell head>{$t('pathway.pages.course.students')}</StructuredListCell>
            </StructuredListRow>
          </StructuredListHead>

          <StructuredListBody>
            {#each filteredCourses as course}
              <StructuredListRow>
                <StructuredListCell>
                  <div class="flex">
                    <div>
                      <Checkbox
                        name={course.title}
                        className="cursor-pointer"
                        value={course.id}
                        checked={courses.some((c) => c.id === course.id)}
                        onInputChange={(e) => toggleAddSelection(course, e.target?.checked)}
                      />
                    </div>
                    <p class="font-semibold text-black dark:text-white">
                      {course.title}
                    </p>
                  </div>
                </StructuredListCell>
                <StructuredListCell class="line-clamp-1">{course.description}</StructuredListCell>
                <StructuredListCell>{course.total_lessons}</StructuredListCell>
                <StructuredListCell>{course.total_students}</StructuredListCell>
              </StructuredListRow>
            {/each}
          </StructuredListBody>
        </StructuredList>
      </div>

      <!-- order course -->
    {:else if $addCourseModal.step === 1 && $pathwayCourses.length > 0}
      <DragAndDropModal bind:courses={$pathwayCourses} />

      <!-- delete course -->
    {:else if $addCourseModal.step === 2}
      <div class="max-w overflow-x-auto">
        <StructuredList class="mb-5">
          <StructuredListHead>
            <StructuredListRow head>
              <StructuredListCell head>{$t('pathway.pages.course.body_title')}</StructuredListCell>
              <StructuredListCell head>{$t('pathway.pages.course.description')}</StructuredListCell>
              <StructuredListCell head>{$t('pathway.pages.course.lessons')}</StructuredListCell>
              <StructuredListCell head>{$t('pathway.pages.course.students')}</StructuredListCell>
            </StructuredListRow>
          </StructuredListHead>

          <StructuredListBody>
            {#each $pathwayCourses as course}
              <StructuredListRow>
                <StructuredListCell>
                  <div class="flex">
                    <div>
                      <Checkbox
                        name={course.course.title}
                        className="cursor-pointer"
                        value={course.id}
                        checked={courses.some((c) => c.id === course.id)}
                        onInputChange={(e) => toggleDeleteSelection(course, e.target?.checked)}
                      />
                    </div>
                    <p class="w-full font-semibold text-black dark:text-white">
                      {course.course.title}
                    </p>
                  </div>
                </StructuredListCell>
                <StructuredListCell class="line-clamp-1"
                  >{course.course.description}</StructuredListCell
                >
                <StructuredListCell>{course.course.lesson.length}</StructuredListCell>
                <StructuredListCell>{course.course.group_id.groupmember.length}</StructuredListCell>
              </StructuredListRow>
            {/each}
          </StructuredListBody>
        </StructuredList>
      </div>
    {/if}
  </main>
  <div slot="buttons" class="flex justify-end">
    <!-- add course -->
    {#if $addCourseModal.step === 0}
      <PrimaryButton
        label={`${$t('pathway.components.addCourseModal.add')} ${courses.length} ${
          courses.length === 1
            ? $t('pathway.components.addCourseModal.course')
            : $t('pathway.components.addCourseModal.courses')
        } ${$t('pathway.components.addCourseModal.path')}`}
        onClick={handleSave}
        {isLoading}
        isDisabled={courses.length < 1}
      />
      <!-- order course -->
    {:else if $addCourseModal.step === 1}
      <div class="mt-5 flex justify-end">
        <PrimaryButton label={$t('pathway.components.dragAndDrop.label')} onClick={handleSaveDnD} />
      </div>
      <!-- delete course -->
    {:else}
      <div class="mt-5 flex justify-end">
        <PrimaryButton
          variant={VARIANTS.CONTAINED_DANGER}
          label={$t('pathway.components.addCourseModal.delete')}
          onClick={() => handleDelete()}
        />
      </div>
    {/if}
  </div>
</Modal>
