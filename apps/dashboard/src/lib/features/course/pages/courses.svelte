<script lang="ts">
  import * as Table from '@cio/ui/base/table';
  import { Empty } from '@cio/ui/custom/empty';
  import { Search } from '@cio/ui/custom/search';
  import LibraryBigIcon from '@lucide/svelte/icons/library-big';
  import * as Page from '@cio/ui/base/page';
  import * as Select from '@cio/ui/base/select';
  import GridIcon from '@lucide/svelte/icons/grid-2x2';
  import ListIcon from '@lucide/svelte/icons/list';
  import { IconButton } from '@cio/ui/custom/icon-button';

  import {
    CourseCardList,
    CourseCardLoader,
    CreateCourseButton,
    CourseList,
    CopyCourseModal,
    NewCourseModal
  } from '$features/course/components';

  import { DeleteModal } from '$features/ui';
  import { t } from '$lib/utils/functions/translations';
  import { snackbar } from '$features/ui/snackbar/store';
  import { courseApi } from '$features/course/api';
  import { deleteCourseModal, deleteCourseModalInitialState, courseMetaDeta } from '../utils/store';
  import { browser } from '$app/environment';
  import type { OrgCourses, UserEnrolledCourses } from '$features/course/types';

  interface Props {
    courses?: OrgCourses | UserEnrolledCourses;
    emptyTitle?: string;
    emptyDescription?: string;
    isExplore?: boolean;
    isLMS?: boolean;
    searchValue?: string;
    selectedId?: string;
    isLoading?: boolean;
  }

  let {
    courses = [],
    emptyTitle = $t('courses.course_card.empty_title'),
    emptyDescription = $t('courses.course_card.empty_description'),
    isExplore = false,
    isLMS = false,
    searchValue = $bindable(''),
    selectedId = $bindable('0'),
    isLoading = false
  }: Props = $props();

  const filterOptions = $derived([
    { value: '0', label: $t('courses.course_filter.date_created') },
    { value: '1', label: $t('courses.course_filter.published') },
    { value: '2', label: $t('courses.course_filter.lessons') }
  ]);

  const selectedLabel = $derived(
    filterOptions.find((opt) => opt.value === selectedId)?.label || filterOptions[0].label
  );

  const setViewPreference = (preference: 'grid' | 'list') => {
    $courseMetaDeta.view = preference;
    if (browser) {
      localStorage.setItem('courseView', preference);
    }
  };

  async function handleDeleteCourse() {
    if (!$deleteCourseModal.id) return;

    $deleteCourseModal.isDeleting = true;

    await courseApi.delete($deleteCourseModal.id);

    if (courseApi.success) {
      deleteCourseModal.set(deleteCourseModalInitialState);
    }

    $deleteCourseModal.isDeleting = false;
  }
</script>

<NewCourseModal />

<CopyCourseModal />

<DeleteModal
  onDelete={handleDeleteCourse}
  bind:open={$deleteCourseModal.open}
  isLoading={$deleteCourseModal.isDeleting}
/>

<Page.BodyHeader align="right">
  <Search placeholder={$t('courses.search_placeholder')} bind:value={searchValue} />
  <Select.Root type="single" bind:value={selectedId}>
    <Select.Trigger class="min-w-[150px]">
      <p>{selectedId ? selectedLabel : filterOptions[0].label}</p>
    </Select.Trigger>
    <Select.Content>
      {#each filterOptions as option (option.label)}
        <Select.Item value={option.value}>{option.label}</Select.Item>
      {/each}
    </Select.Content>
  </Select.Root>
  {#if $courseMetaDeta.view === 'list'}
    <IconButton onclick={() => setViewPreference('grid')}>
      <GridIcon size={16} />
    </IconButton>
  {:else}
    <IconButton onclick={() => setViewPreference('list')}>
      <ListIcon size={16} />
    </IconButton>
  {/if}
</Page.BodyHeader>

<div class="mx-auto w-full flex-1">
  {#if isLoading}
    <section class={`${isLoading || courses ? 'cards-container' : ''} `}>
      <CourseCardLoader />
      <CourseCardLoader />
      <CourseCardLoader />
    </section>
  {:else if !courses.length}
    <Empty title={emptyTitle} description={emptyDescription} icon={LibraryBigIcon} variant="page">
      {#if !isLMS}
        <CreateCourseButton isResponsive />
      {/if}
    </Empty>
  {:else if $courseMetaDeta.view === 'list'}
    <div class="w-full overflow-hidden rounded-md border">
      <Table.Root class="w-full table-fixed">
        <Table.Header>
          <Table.Row>
            <Table.Head class="w-[20%]">{$t('courses.course_card.list_view.title')}</Table.Head>
            <Table.Head class="w-[30%]">{$t('courses.course_card.list_view.description')}</Table.Head>
            <Table.Head class="w-[10%]">{$t('courses.course_card.list_view.type')}</Table.Head>
            <Table.Head class="w-[10%]">{$t('courses.course_card.list_view.lessons')}</Table.Head>
            <Table.Head class="w-[10%]">{$t('courses.course_card.list_view.students')}</Table.Head>
            <Table.Head class="w-[12%]">{$t('courses.course_card.list_view.published')}</Table.Head>
            <Table.Head class="w-[8%]"></Table.Head>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {#each courses as courseData (courseData.id)}
            <CourseList
              id={courseData.id}
              title={courseData.title}
              type={$t(`course.navItem.settings.${courseData.type.toLowerCase()}`)}
              description={courseData.description}
              isPublished={courseData.isPublished}
              totalLessons={courseData.lessonCount}
              totalStudents={'totalStudents' in courseData ? courseData.totalStudents : 0}
            />
          {/each}
        </Table.Body>
      </Table.Root>
    </div>
  {:else}
    <CourseCardList {courses} {isExplore} {isLMS} />
  {/if}
</div>
