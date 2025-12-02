<script lang="ts">
  import * as Table from '@cio/ui/base/table';
  import { Empty } from '@cio/ui/custom/empty';
  import { Search } from '@cio/ui/custom/search';
  import LibraryBigIcon from '@lucide/svelte/icons/library-big';
  import * as Page from '@cio/ui/base/page';
  import * as Select from '@cio/ui/base/select';
  import GridIcon from '@lucide/svelte/icons/grid-2x2';
  import ListIcon from '@lucide/svelte/icons/list';
  import { IconButton } from '$lib/components/IconButton';

  import {
    CourseCard,
    CourseCardLoader,
    CreateCourseButton,
    CourseList,
    CopyCourseModal,
    NewCourseModal
  } from '$lib/features/course/components';

  import DeleteModal from '$lib/components/Modal/DeleteModal.svelte';
  import type { Course } from '$lib/utils/types';
  import { globalStore } from '$lib/utils/store/app';
  import { t } from '$lib/utils/functions/translations';
  import { snackbar } from '$lib/components/Snackbar/store';
  import { deleteCourse } from '$lib/utils/services/courses';
  import {
    deleteCourseModal,
    deleteCourseModalInitialState,
    courses as coursesStore,
    courseMetaDeta
  } from '../utils/store';
  import { browser } from '$app/environment';

  interface Props {
    courses?: Course[];
    emptyTitle?: any;
    emptyDescription?: any;
    isExplore?: boolean;
    searchValue?: string;
    selectedId?: string;
  }

  let {
    courses = [],
    emptyTitle = $t('courses.course_card.empty_title'),
    emptyDescription = $t('courses.course_card.empty_description'),
    isExplore = false,
    searchValue = $bindable(''),
    selectedId = $bindable('0')
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

  function calcProgressRate(progressRate?: number, totalLessons?: number): number {
    if (!progressRate || !totalLessons) {
      return 0;
    }

    return Math.round((progressRate / totalLessons) * 100);
  }

  async function handleDeleteCourse() {
    if (!$deleteCourseModal.id) return;

    $deleteCourseModal.isDeleting = true;

    try {
      await deleteCourse($deleteCourseModal.id);

      // Remove the course from the courses store
      $coursesStore = $coursesStore.filter((course) => course.id !== $deleteCourseModal.id);

      // Show success message
      snackbar.success('snackbar.course_deleted');

      // Close modal and reset state
      deleteCourseModal.set(deleteCourseModalInitialState);
    } catch (error) {
      console.error('Error deleting course:', error);
      snackbar.error('snackbar.course_settings.error.went_wrong');

      // Stop deleting state on error
      $deleteCourseModal.isDeleting = false;
    }
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
      {#each filterOptions as option}
        <Select.Item value={option.value}>{option.label}</Select.Item>
      {/each}
    </Select.Content>
  </Select.Root>
  {#if $courseMetaDeta.view === 'list'}
    <IconButton onClick={() => setViewPreference('grid')}>
      <GridIcon size={16} />
    </IconButton>
  {:else}
    <IconButton onClick={() => setViewPreference('list')}>
      <ListIcon size={16} />
    </IconButton>
  {/if}
</Page.BodyHeader>

<div class="mx-auto w-full flex-1">
  {#if $courseMetaDeta.isLoading}
    <section class={`${$courseMetaDeta.isLoading || courses ? 'cards-container' : ''} `}>
      <CourseCardLoader />
      <CourseCardLoader />
      <CourseCardLoader />
    </section>
  {:else if !courses.length}
    <Empty title={emptyTitle} description={emptyDescription} icon={LibraryBigIcon} variant="page">
      <CreateCourseButton isResponsive />
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
          {#each courses as courseData}
            <CourseList
              id={courseData.id}
              title={courseData.title}
              type={$t(`course.navItem.settings.${courseData.type.toLowerCase()}`)}
              description={courseData.description}
              isPublished={courseData.is_published}
              totalLessons={courseData.total_lessons}
              totalStudents={courseData.total_students}
            />
          {/each}
        </Table.Body>
      </Table.Root>
    </div>
  {:else}
    <section class={`relative ${$courseMetaDeta.isLoading || courses ? 'cards-container' : ''} `}>
      {#each courses as courseData}
        {#key courseData.id}
          <CourseCard
            id={courseData.id}
            slug={courseData.slug}
            bannerImage={courseData.logo || '/images/classroomio-course-img-template.jpg'}
            title={courseData.title}
            description={courseData.description}
            isPublished={courseData.is_published}
            type={courseData.type}
            currency={courseData.currency}
            totalLessons={courseData.total_lessons}
            totalStudents={courseData.total_students}
            isLMS={$globalStore.isOrgSite}
            {isExplore}
            progressRate={calcProgressRate(courseData.progress_rate, courseData.total_lessons)}
          />
        {/key}
      {/each}
    </section>
  {/if}
</div>
