<script lang="ts">
  import {
    StructuredList,
    StructuredListBody,
    StructuredListCell,
    StructuredListHead,
    StructuredListRow
  } from 'carbon-components-svelte';

  import { addCourseModal, pathway } from '../store';
  import type { PathwayCourse } from '$lib/utils/types';
  import { t } from '$lib/utils/functions/translations';

  import Tabs from '$lib/components/Tabs/index.svelte';
  import Modal from '$lib/components/Modal/index.svelte';
  import Checkbox from '$lib/components/Form/Checkbox.svelte';
  import TabContent from '$lib/components/TabContent/index.svelte';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';

  let group: PathwayCourse[] = [];
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
      p.selectedCourses = group;
      return p;
    });
    $addCourseModal.open = false;
  }

  function toggleCourseSelection(course: PathwayCourse, checked: boolean) {
    if (checked) {
      group = [...group, course];
    } else {
      group = group.filter((c) => c.id !== course.id);
    }
  }

  $: filteredCourses = $pathway.courses.filter((course) =>
    course.title.toLowerCase().includes(searchValue.toLowerCase())
  );

  $: filteredPickedCourses = group.filter((course) =>
    course.title.toLowerCase().includes(searchValue.toLowerCase())
  );

  $: tabs = [
    {
      label: `All Courses`,
      value: '1'
    },
    {
      label: `Picked Courses`,
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
  modalHeading="Add Course to Learning Path"
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
                      <div class="flex items-center text-left gap-4">
                        <Checkbox
                          label=""
                          name={course.title}
                          className="w-2"
                          value={course.id}
                          checked={group.includes(course)}
                          onInputChange={(e) => toggleCourseSelection(course, e.target?.checked)}
                        />
                        <p class="font-semibold text-black dark:text-white">
                          {course.title}
                        </p>
                      </div>
                    </StructuredListCell>
                    <StructuredListCell>{course.description}</StructuredListCell>
                    <StructuredListCell>{course.lessonNumber}</StructuredListCell>
                    <StructuredListCell>{course.studentNumber}</StructuredListCell>
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
                      <div class="flex items-center text-left gap-4">
                        <Checkbox
                          label=""
                          name={course.title}
                          className="w-2"
                          value={course.id}
                          checked={true}
                          onInputChange={(e) => toggleCourseSelection(course, e.target?.checked)}
                        />
                        <p class="font-semibold text-black dark:text-white">
                          {course.title}
                        </p>
                      </div>
                    </StructuredListCell>
                    <StructuredListCell>{course.description}</StructuredListCell>
                    <StructuredListCell>{course.lessonNumber}</StructuredListCell>
                    <StructuredListCell>{course.studentNumber}</StructuredListCell>
                  </StructuredListRow>
                {/each}
              </StructuredListBody>
            </TabContent>
          </StructuredList>

          <div class="flex justify-end">
            <PrimaryButton
              label={`Add ${group.length} ${
                group.length === 1 ? 'Course' : 'Courses'
              } to Learning Path`}
              onClick={handleSave}
            />
          </div>
        </div>
      </slot:fragment>
    </Tabs>
  </main>
</Modal>
