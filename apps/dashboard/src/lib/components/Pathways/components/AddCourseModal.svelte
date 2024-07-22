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
  import { addCourseModal, pathway, courses } from '../store';

  import type { PathwayCourse } from '$lib/utils/types';
  import { t } from '$lib/utils/functions/translations';
  import { fetchCourses } from '$lib/components/Courses/api';

  import Tabs from '$lib/components/Tabs/index.svelte';
  import Modal from '$lib/components/Modal/index.svelte';
  import Checkbox from '$lib/components/Form/Checkbox.svelte';
  import TabContent from '$lib/components/TabContent/index.svelte';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';

  let group: PathwayCourse[] = [];
  let Courses;
  let searchValue = '';

  const onChange = (tab) => {
    return () => {
      currentTab = tab;
    };
  };

  function close() {
    $addCourseModal.open = false;
  }

  function handleSave() {
    pathway.update((p) => {
      const existingCoursesMap = new Map(p.courses.map((course) => [course.id, course]));
      group.forEach((course) => existingCoursesMap.set(course.id, course));
      p.courses = Array.from(existingCoursesMap.values());

      return p;
    });
    $addCourseModal.open = false;
    console.log('pathway', $pathway);
  }

  function toggleCourseSelection(course: PathwayCourse, checked: boolean) {
    if (checked) {
      group = [...group, course];
    } else {
      group = group.filter((c) => c.id !== course.id);
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

  $: filteredPickedCourses = group.filter((course) =>
    course.title.toLowerCase().includes(searchValue.toLowerCase())
  );

  $: tabs = [
    {
      label: $t('pathways.components.addCourseModal.all_courses'),
      value: '1'
    },
    {
      label: $t('pathways.components.addCourseModal.picked_courses'),
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
  bind:value={searchValue}
  modalHeading={$t('pathways.components.addCourseModal.modal_heading')}
>
  <main>
    <Tabs tabSpacing="gap-14" {tabs} {currentTab} {onChange} alignCenter={true}>
      <slot:fragment slot="content">
        <div class="max-w overflow-x-auto">
          <StructuredList>
            <StructuredListHead>
              <StructuredListRow head>
                <StructuredListCell head
                  >{$t('pathways.pages.course.body_title')}</StructuredListCell
                >
                <StructuredListCell head
                  >{$t('pathways.pages.course.description')}</StructuredListCell
                >
                <StructuredListCell head>{$t('pathways.pages.course.lessons')}</StructuredListCell>
                <StructuredListCell head>{$t('pathways.pages.course.students')}</StructuredListCell>
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
                            checked={group.includes(course)}
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
                            onInputChange={(e) => toggleCourseSelection(course, e.target?.checked)}
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
              label={`${$t('pathways.components.addCourseModal.add')} ${group.length} ${
                group.length === 1
                  ? $t('pathways.components.addCourseModal.course')
                  : $t('pathways.components.addCourseModal.courses')
              } ${$t('pathways.components.addCourseModal.path')}`}
              onClick={handleSave}
            />
          </div>
        </div>
      </slot:fragment>
    </Tabs>
  </main>
</Modal>
