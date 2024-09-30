<script lang="ts">
  import {
    StructuredList,
    StructuredListBody,
    StructuredListCell,
    StructuredListHead,
    StructuredListRow,
    Search
  } from 'carbon-components-svelte';

  import { courses } from '../store';
  import { addCourseModal } from '../store';
  import { profile } from '$lib/utils/store/user';
  import { currentOrg } from '$lib/utils/store/org';
  import { snackbar } from '$lib/components/Snackbar/store';
  import type { Course, PathwayCourse } from '$lib/utils/types';
  import { t } from '$lib/utils/functions/translations';
  import { fetchCourses } from '$lib/utils/services/courses';
  import {
    addPathwayCourse,
    deletePathwayCourse,
    updatePathwayCourses
  } from '$lib/utils/services/pathways';
  import { VARIANTS } from '$lib/components/PrimaryButton/constants';

  import Modal from '$lib/components/Modal/index.svelte';
  import DragAndDropModal from './DragAndDropModal.svelte';
  import Checkbox from '$lib/components/Form/Checkbox.svelte';
  import IconButton from '$lib/components/IconButton/index.svelte';
  import ArrowLeft from 'carbon-icons-svelte/lib/ArrowLeft.svelte';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';

  export let pathwayId;

  let searchValue = '';
  let isSearchInputOpened = false;
  let allOrgCourses: Course[] = [];
  let pathwayCourses: PathwayCourse[] = [];
  let isLoading: boolean = false;

  function close() {
    $addCourseModal.open = false;
    $addCourseModal.step = 0;
  }

  async function handleSave() {
    isLoading = true;
    // courses in the store
    const existingCourses = $courses;
    const currentCourseCount = existingCourses.length;

    // filters out courses that are already in the courses store
    const newCourses = pathwayCourses
      .filter((course) => !existingCourses.some((c) => c.course_id === course.id))
      .map((course, index) => ({
        id: '',
        course: course,
        course_id: course.id,
        pathway_id: pathwayId || '',
        order: currentCourseCount + index + 1
      }));

    // adds each of the courses that are not in the courses store
    for (const newCourse of newCourses) {
      try {
        const { data, error } = await addPathwayCourse(
          newCourse.pathway_id,
          newCourse.course_id,
          newCourse.order
        );

        if (error) {
          console.error('Error updating course in Supabase:', error);
        }

        if (data && data.length > 0) {
          // takes the first object of the data array (there will always be one object because it's calling the function for each of them)
          const insertedCourse = data[0];

          // update the courses store with the response of each of the calls from Supabase
          courses.update((existingCourses) => [
            ...existingCourses,
            {
              ...newCourse,
              id: insertedCourse.id,
              created_at: insertedCourse.created_at,
              updated_at: insertedCourse.updated_at,
              is_unlocked: insertedCourse.is_unlocked,
              order: insertedCourse.order
            }
          ]);
        }
      } catch (error) {
        console.error('Error updating course in Supabase:', error);
      }
    }
    isLoading = false;

    // move to the order step
    $addCourseModal.step = 1;
  }

  const handleSaveDnD = () => {
    $courses.forEach(async (course) => {
      try {
        await updatePathwayCourses(course.id, course.order);
      } catch (error) {
        console.error('Error deleting course from Supabase:', error);
      }
    });

    $addCourseModal.open = false;
  };

  const deleteCourse = async () => {
    for (const course of pathwayCourses) {
      try {
        const { error } = await deletePathwayCourse(course.course_id);

        if (error) {
          snackbar.error(error.message);
          return console.error('Error deleting course', error);
        }

        courses.update((existingCourses) =>
          existingCourses.filter((c) => c.course_id !== course.course_id)
        );
      } catch (error) {
        console.error('Error deleting course from Supabase:', error);
      }
    }

    pathwayCourses = [];
    $addCourseModal.open = false;
  };

  function toggleCourseSelection(course: PathwayCourse, checked: boolean) {
    if (checked) {
      // Avoid duplicating the course
      if (!pathwayCourses.some((c) => c.id === course.id)) {
        pathwayCourses = [...pathwayCourses, course];
      }
    } else {
      pathwayCourses = pathwayCourses.filter((c) => c.id !== course.id);
    }
  }

  async function fetchCourse(userId?: string, orgId?: string) {
    const data = await fetchCourses(userId, orgId);

    if (!data) return;

    // shows all the courses that are on the org but not in the pathway
    // this to to be able to display the courses to add to pathway and also for the search filter func
    allOrgCourses = data.allCourses.filter(
      (course) => !$courses.some((c) => c.course?.id === course.id)
    );
  }

  $: fetchCourse($profile.id, $currentOrg.id);

  // displayed all the courses form line 124 with the filtering option for the searchbar
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
                  <div class="flex items-center">
                    <div class="flex justify-center items-center">
                      <Checkbox
                        name={course.title}
                        className="cursor-pointer"
                        value={course.id}
                        checked={pathwayCourses.some((c) => c.id === course.id)}
                        onInputChange={(e) => toggleCourseSelection(course, e.target?.checked)}
                      />
                    </div>
                    <p class="font-semibold w-full text-black dark:text-white">
                      {course.title}
                    </p>
                  </div>
                </StructuredListCell>
                <StructuredListCell>{course.description}</StructuredListCell>
                <StructuredListCell>{course.total_lessons}</StructuredListCell>
                <StructuredListCell>{course.total_students}</StructuredListCell>
              </StructuredListRow>
            {/each}
          </StructuredListBody>
        </StructuredList>
      </div>

      <!-- order course -->
    {:else if $addCourseModal.step === 1 && $courses.length > 0}
      <DragAndDropModal bind:pathwayCourses={$courses} />

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
            {#each $courses as course}
              <StructuredListRow>
                <StructuredListCell>
                  <div class="flex items-center">
                    <div class="flex justify-center items-center">
                      <Checkbox
                        name={course.course.title}
                        className="cursor-pointer"
                        value={course.id}
                        checked={pathwayCourses.some((c) => c.id === course.id)}
                        onInputChange={(e) => toggleCourseSelection(course, e.target?.checked)}
                      />
                    </div>
                    <p class="font-semibold w-full text-black dark:text-white">
                      {course.course.title}
                    </p>
                  </div>
                </StructuredListCell>
                <StructuredListCell>{course.course.description}</StructuredListCell>
                <StructuredListCell>{course.course.lessons?.length}</StructuredListCell>
                <StructuredListCell
                  >{course.course.group_id?.groupmember?.length}</StructuredListCell
                >
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
        label={`${$t('pathway.components.addCourseModal.add')} ${pathwayCourses.length} ${
          pathwayCourses.length === 1
            ? $t('pathway.components.addCourseModal.course')
            : $t('pathway.components.addCourseModal.courses')
        } ${$t('pathway.components.addCourseModal.path')}`}
        onClick={handleSave}
        {isLoading}
        isDisabled={pathwayCourses.length < 1}
      />
      <!-- order course -->
    {:else if $addCourseModal.step === 1}
      <div class="flex justify-end mt-5">
        <PrimaryButton label={$t('pathway.components.dragAndDrop.label')} onClick={handleSaveDnD} />
      </div>
      <!-- delete course -->
    {:else}
      <div class="flex justify-end mt-5">
        <PrimaryButton
          variant={VARIANTS.CONTAINED_DANGER}
          label={$t('pathway.components.addCourseModal.delete')}
          onClick={deleteCourse}
        />
      </div>
    {/if}
  </div>
</Modal>
