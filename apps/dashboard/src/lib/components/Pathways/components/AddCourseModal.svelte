<script lang="ts">
  import {
    StructuredList,
    StructuredListBody,
    StructuredListCell,
    StructuredListHead,
    StructuredListRow
  } from 'carbon-components-svelte';

  import { profile } from '$lib/utils/store/user';
  import { currentOrg } from '$lib/utils/store/org';
  import { addCourseModal, courses } from '../store';

  import type { PathwayCourse } from '$lib/utils/types';
  import { t } from '$lib/utils/functions/translations';
  import { fetchCourses } from '$lib/utils/services/courses';

  import Tabs from '$lib/components/Tabs/index.svelte';
  import Modal from '$lib/components/Modal/index.svelte';
  import Checkbox from '$lib/components/Form/Checkbox.svelte';
  import TabContent from '$lib/components/TabContent/index.svelte';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import DragAndDropModal from './DragAndDropModal.svelte';

  let pathwayCourse: PathwayCourse[] = [];
  let Courses;
  let searchValue = '';

  const onChange = (tab) => {
    return () => {
      currentTab = tab;
    };
  };

  function close() {
    $addCourseModal.open = false;
    $addCourseModal.step = 0;
  }

  function updateGroup(e) {
    pathwayCourse = e.detail;
  }

  function handleSave() {
    $addCourseModal.step = 1;
  }

  function toggleCourseSelection(course: PathwayCourse, checked: boolean) {
    if (checked) {
      pathwayCourse = [...pathwayCourse, course];
    } else {
      pathwayCourse = pathwayCourse.filter((c) => c.id !== course.id);
    }
  }

  async function fetchCourse(userId?: string, orgId?: string) {
    Courses = await fetchCourses(userId, orgId);
    if (!Courses) return;

    courses.set(Courses.allCourses);
  }

  $: fetchCourse($profile.id, $currentOrg.id);

  $: filteredCourses = $courses.filter((course) =>
    course.title.toLowerCase().includes(searchValue.toLowerCase())
  );

  $: filteredPickedCourses = pathwayCourse.filter((course) =>
    course.title.toLowerCase().includes(searchValue.toLowerCase())
  );

  $: tabs = [
    {
      label: $t('pathway.components.addCourseModal.all_courses'),
      value: '1'
    },
    {
      label: $t('pathway.components.addCourseModal.picked_courses'),
      value: '2'
    }
  ];

  $: currentTab = tabs[0].value;
</script>

<Modal
  onClose={close}
  bind:open={$addCourseModal.open}
  width="w-3/5"
  showSearchBar={true}
  backButton={$addCourseModal.step === 1 && true}
  buttonColor="blue"
  buttonOnClick={() => ($addCourseModal.step = 0)}
  bind:value={searchValue}
  modalHeading={$addCourseModal.step === 0
    ? $t('pathway.components.addCourseModal.modal_heading')
    : $t('pathway.components.dragAndDrop.title')}
>
  <main>
    {#if $addCourseModal.step === 0}
      <Tabs tabSpacing="gap-14" {tabs} {currentTab} {onChange} alignCenter={true}>
        <slot:fragment slot="content">
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
                  <StructuredListCell head>{$t('pathway.pages.course.lessons')}</StructuredListCell>
                  <StructuredListCell head>{$t('pathway.pages.course.students')}</StructuredListCell
                  >
                </StructuredListRow>
              </StructuredListHead>

              <!--  -->
              <TabContent value={tabs[0].value} index={currentTab}>
                <StructuredListBody>
                  {#each filteredCourses as course}
                    <StructuredListRow>
                      <StructuredListCell>
                        <div class="flex items-center">
                          <div class="flex justify-center items-center">
                            <Checkbox
                              label=""
                              name={course.title}
                              className="cursor-pointer"
                              value={course.id}
                              checked={pathwayCourse.includes(course)}
                              onInputChange={(e) =>
                                toggleCourseSelection(course, e.target?.checked)}
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
              </TabContent>

              <!--  -->
              <TabContent value={tabs[1].value} index={currentTab}>
                <StructuredListBody>
                  {#each filteredPickedCourses as course}
                    <StructuredListRow>
                      <StructuredListCell>
                        <div class="flex items-center">
                          <div class="flex justify-center items-center">
                            <Checkbox
                              label=""
                              name={course.title}
                              className="cursor-pointer"
                              value={course.id}
                              checked={true}
                              onInputChange={(e) =>
                                toggleCourseSelection(course, e.target?.checked)}
                            />
                          </div>
                          <p class="font-semibold text-black dark:text-white">
                            {course.title}
                          </p>
                        </div></StructuredListCell
                      >
                      <StructuredListCell>{course.description}</StructuredListCell>
                      <StructuredListCell>{course.total_lessons}</StructuredListCell>
                      <StructuredListCell>{course.total_students}</StructuredListCell>
                    </StructuredListRow>
                  {/each}
                </StructuredListBody>
              </TabContent>
            </StructuredList>

            <div class="flex justify-end">
              <PrimaryButton
                label={`${$t('pathway.components.addCourseModal.add')} ${pathwayCourse.length} ${
                  pathwayCourse.length === 1
                    ? $t('pathway.components.addCourseModal.course')
                    : $t('pathway.components.addCourseModal.courses')
                } ${$t('pathway.components.addCourseModal.path')}`}
                onClick={handleSave}
                isDisabled={pathwayCourse.length < 1}
              />
            </div>
          </div>
        </slot:fragment>
      </Tabs>
    {:else if $addCourseModal.step === 1}
      <DragAndDropModal bind:pathwayCourse on:update={updateGroup} />
    {/if}
  </main>
</Modal>
