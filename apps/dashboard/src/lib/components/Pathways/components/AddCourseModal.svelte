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
  import type { Course, PathwayCourse } from '$lib/utils/types';
  import { t } from '$lib/utils/functions/translations';
  import { fetchCourses } from '$lib/utils/services/courses';
  import { addPathwayCourse } from '$lib/utils/services/pathways';

  import Modal from '$lib/components/Modal/index.svelte';
  import DragAndDropModal from './DragAndDropModal.svelte';
  import Checkbox from '$lib/components/Form/Checkbox.svelte';
  import IconButton from '$lib/components/IconButton/index.svelte';
  import ArrowLeft from 'carbon-icons-svelte/lib/ArrowLeft.svelte';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';

  export let pathwayId;

  let searchValue = '';
  let isSearchInputOpened = false;
  let allCourses: Course[] = [];
  let pathwayCourses: PathwayCourse[] = [];

  function close() {
    $addCourseModal.open = false;
    $addCourseModal.step = 0;
  }

  function handleSave() {
    courses.update((existingCourses) => {
      const currentCourseCount = existingCourses.length;

      const newCourses = pathwayCourses
        .filter((course) => !existingCourses.some((c) => c.course_id === course.id))
        .map((course, index) => ({
          id: '',
          course: course,
          course_id: course.id,
          pathway_id: pathwayId || '',
          order: currentCourseCount + index + 1
        }));

      newCourses.forEach(async (newCourse) => {
        try {
          await addPathwayCourse(newCourse.pathway_id, newCourse.course_id);
        } catch (error) {
          console.error('Error updating course in Supabase:', error);
        }
      });

      return [...existingCourses, ...newCourses];
    });

    $addCourseModal.step = 1;
  }

  function toggleCourseSelection(course: PathwayCourse, checked: boolean) {
    if (checked) {
      // avoid duplicating the course
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
    allCourses = data.allCourses;

    // filter out courses that already exist in $courses
    allCourses = data.allCourses.filter(
      (course) => !$courses.some((c) => c.course?.id === course.id)
    );
  }

  $: fetchCourse($profile.id, $currentOrg.id);

  $: filteredCourses = searchValue
    ? allCourses.filter((course) => course.title.toLowerCase().includes(searchValue.toLowerCase()))
    : allCourses;
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

        <div class="flex justify-end">
          <PrimaryButton
            label={`${$t('pathway.components.addCourseModal.add')} ${pathwayCourses.length} ${
              pathwayCourses.length === 1
                ? $t('pathway.components.addCourseModal.course')
                : $t('pathway.components.addCourseModal.courses')
            } ${$t('pathway.components.addCourseModal.path')}`}
            onClick={handleSave}
            isDisabled={pathwayCourses.length < 1}
          />
        </div>
      </div>
    {:else if $addCourseModal.step === 1}
      <DragAndDropModal
        bind:pathwayCourses={$courses}
        on:update={(e) => (pathwayCourses = e.detail)}
      />
    {/if}
  </main>
</Modal>
