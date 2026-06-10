<script lang="ts">
  import * as ResourceListRow from '@cio/ui/custom/resource-list-row';
  import { Empty } from '@cio/ui/custom/empty';
  import { Search } from '@cio/ui/custom/search';
  import LibraryBigIcon from '@lucide/svelte/icons/library-big';
  import * as Page from '@cio/ui/base/page';
  import { SortSelect } from '$features/ui';
  import GridIcon from '@lucide/svelte/icons/grid-2x2';
  import ListIcon from '@lucide/svelte/icons/list';
  import { IconButton } from '@cio/ui/custom/icon-button';

  import {
    CourseCardList,
    CourseCardLoader,
    CourseListRow,
    CreateCourseButton,
    CopyCourseModal,
    NewCourseModal
  } from '$features/course/components';

  import { DeleteModal } from '$features/ui';
  import { t } from '$lib/utils/functions/translations';
  import { courseApi } from '$features/course/api';
  import { COURSE_SORT_OPTIONS, DEFAULT_COURSE_SORT, type CourseSortBy } from '../utils/constants';
  import { deleteCourseModal, deleteCourseModalInitialState, courseMetaDeta } from '../utils/store';
  import { browser } from '$app/environment';
  import type { OrgCourses, UserEnrolledCourses } from '$features/course/types';
  import type { Snippet } from 'svelte';

  interface Props {
    courses?: OrgCourses | UserEnrolledCourses;
    emptyTitle?: string;
    emptyDescription?: string;
    isExplore?: boolean;
    isLMS?: boolean;
    searchValue?: string;
    sortKey?: CourseSortBy;
    isLoading?: boolean;
    showSortSelect?: boolean;
    filterControls?: Snippet;
    onCardClick?: (course: (OrgCourses | UserEnrolledCourses)[number]) => void;
    emptyAction?: Snippet;
  }

  let {
    courses = [],
    emptyTitle = $t('courses.course_card.empty_title'),
    emptyDescription = $t('courses.course_card.empty_description'),
    isExplore = false,
    isLMS = false,
    searchValue = $bindable(''),
    sortKey = $bindable(DEFAULT_COURSE_SORT),
    isLoading = false,
    showSortSelect = true,
    filterControls,
    onCardClick,
    emptyAction
  }: Props = $props();

  const filterOptions = $derived(
    COURSE_SORT_OPTIONS.map((option) => ({
      value: option.value,
      label: $t(option.label)
    }))
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

<Page.BodyHeader align="right" class="p-0!">
  <Search placeholder={$t('courses.search_placeholder')} bind:value={searchValue} />
  {#if showSortSelect}
    <SortSelect options={filterOptions} bind:value={sortKey} />
  {/if}
  {@render filterControls?.()}

  {#if !isLMS}
    {#if $courseMetaDeta.view === 'list'}
      <IconButton onclick={() => setViewPreference('grid')}>
        <GridIcon size={16} />
      </IconButton>
    {:else}
      <IconButton onclick={() => setViewPreference('list')}>
        <ListIcon size={16} />
      </IconButton>
    {/if}
  {/if}
</Page.BodyHeader>

<div class="mx-auto mt-4 w-full flex-1">
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
      {:else if emptyAction}
        {@render emptyAction()}
      {/if}
    </Empty>
  {:else if isLMS || $courseMetaDeta.view === 'grid'}
    <CourseCardList {courses} {isExplore} {isLMS} {onCardClick} />
  {:else}
    <ResourceListRow.Group>
      {#each courses as courseData (courseData.id)}
        <CourseListRow
          id={courseData.id}
          slug={courseData.slug ?? ''}
          title={courseData.title}
          logo={courseData.logo ?? null}
          type={courseData.type}
          description={courseData.description}
          isPublished={courseData.isPublished ?? false}
          lessonCount={courseData.lessonCount}
          exerciseCount={'exerciseCount' in courseData ? (courseData.exerciseCount ?? 0) : 0}
          totalStudents={'totalStudents' in courseData ? courseData.totalStudents : 0}
          updatedAt={'updatedAt' in courseData ? (courseData.updatedAt ?? null) : null}
          tags={('tags' in courseData && Array.isArray(courseData.tags) ? courseData.tags : []) as Array<{
            id: string;
            name: string;
            slug: string;
            color?: string | null;
          }>}
          {isExplore}
          {isLMS}
        />
      {/each}
    </ResourceListRow.Group>
  {/if}
</div>
