<script lang="ts">
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import * as Table from '@cio/ui/base/table';
  import * as Page from '@cio/ui/base/page';
  import * as Alert from '@cio/ui/base/alert';
  import { Search } from '@cio/ui/custom/search';
  import { IconButton } from '@cio/ui/custom/icon-button';
  import { Button } from '@cio/ui/base/button';
  import { Empty } from '@cio/ui/custom/empty';
  import { CourseCard } from '$features/course/components';
  import { DeleteModal } from '$features/ui';
  import CoursePublishBadge from '$features/course/components/course-publish-badge.svelte';
  import { courseMetaDeta } from '$features/course/utils/store';
  import BookOpenIcon from '@lucide/svelte/icons/book-open';
  import GridIcon from '@lucide/svelte/icons/grid-2x2';
  import ListIcon from '@lucide/svelte/icons/list';
  import Plus from '@lucide/svelte/icons/plus';
  import Trash2Icon from '@lucide/svelte/icons/trash-2';
  import { t } from '$lib/utils/functions/translations';
  import { cohortApi } from '$features/cohort/api';
  import type { OrgCourses } from '$features/course/types';
  import AddCourseToCohortModal from '$features/cohort/components/add-course-to-cohort-modal.svelte';
  import { browser } from '$app/environment';
  import { onMount } from 'svelte';

  let { data } = $props();

  let showAddCourseModal = $state(false);
  let showDeleteModal = $state(false);
  let courseToDeleteId = $state<string | null>(null);
  let searchValue = $state('');

  const courses = $derived(cohortApi.courses);
  const filteredCourses = $derived.by(() => {
    const normalizedSearch = searchValue.trim().toLowerCase();
    if (!normalizedSearch) {
      return courses;
    }

    return courses.filter((item) =>
      [item.course.title, item.course.description].some((value) => value?.toLowerCase().includes(normalizedSearch))
    );
  });

  const courseCards = $derived(
    filteredCourses.map((item) => ({
      id: item.course.id,
      slug: item.course.slug ?? '',
      logo: item.course.coverImage,
      title: item.course.title ?? '',
      description: item.course.description ?? '',
      lessonCount: 0,
      totalStudents: 0,
      isPublished: item.course.status === 'ACTIVE',
      tags: []
    }))
  );

  function setViewPreference(preference: 'grid' | 'list') {
    $courseMetaDeta.view = preference;
    if (browser) {
      localStorage.setItem('courseView', preference);
    }
  }

  function openDeleteModal(courseId: string) {
    courseToDeleteId = courseId;
    showDeleteModal = true;
  }

  async function handleRemoveCourse() {
    if (!courseToDeleteId) return;

    await cohortApi.removeCourse(data.cohortId, courseToDeleteId);
    showDeleteModal = false;
    courseToDeleteId = null;
  }

  function openCourse(courseId: string) {
    goto(resolve(`/courses/[id]`, { id: courseId }));
  }

  onMount(() => {
    const courseView = localStorage.getItem('courseView') as 'grid' | 'list' | null;

    if (courseView) {
      $courseMetaDeta.view = courseView;
    }
  });
</script>

<Page.Root class="mx-auto flex w-[90%] px-4 md:max-w-5xl">
  <Page.Header>
    <Page.HeaderContent class="min-w-0 flex-1">
      <Page.Title>{$t('cohorts.sidebar.courses') || 'Courses'}</Page.Title>
      <Alert.Callout
        variant="information"
        title={$t('cohorts.courses.published_access_callout_title')}
        description={$t('cohorts.courses.published_access_callout_description')}
        class="mt-3 w-full"
      />
    </Page.HeaderContent>
    <Page.Action>
      <Button onclick={() => (showAddCourseModal = true)}>
        <Plus size={16} />
        {$t('cohorts.courses.add') || 'Add Course'}
      </Button>
    </Page.Action>
  </Page.Header>
  <Page.Body>
    {#snippet child()}
      <Page.BodyHeader align="right" class="p-0!">
        <Search placeholder={$t('courses.search_placeholder')} bind:value={searchValue} />

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

      {#if filteredCourses.length === 0}
        <Empty
          title={$t('cohorts.courses.empty_title') || 'No courses yet'}
          description={searchValue.trim()
            ? $t('cohorts.courses.no_matching_program_courses') || 'No cohort courses match your search.'
            : $t('cohorts.courses.empty_description') || 'Add courses to this cohort.'}
          icon={BookOpenIcon}
          variant="page"
        >
          {#if !searchValue.trim()}
            <Button onclick={() => (showAddCourseModal = true)}>
              <Plus size={16} />
              {$t('cohorts.courses.add') || 'Add Course'}
            </Button>
          {/if}
        </Empty>
      {:else if $courseMetaDeta.view === 'list'}
        <div class="mt-4 w-full overflow-hidden rounded-md border">
          <Table.Root class="w-full table-fixed">
            <Table.Header>
              <Table.Row>
                <Table.Head class="w-[28%]">{$t('courses.course_card.list_view.title')}</Table.Head>
                <Table.Head class="w-[44%]">{$t('courses.course_card.list_view.description')}</Table.Head>
                <Table.Head class="w-[10%]">{$t('courses.course_card.list_view.published')}</Table.Head>
                <Table.Head class="w-[8%]"></Table.Head>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {#each filteredCourses as item (item.id)}
                <Table.Row class="cursor-pointer" onclick={() => openCourse(item.course.id)}>
                  <Table.Cell class="truncate">
                    <p class="font-semibold">{item.course.title}</p>
                  </Table.Cell>
                  <Table.Cell class="truncate">
                    <p>{item.course.description}</p>
                  </Table.Cell>
                  <Table.Cell>
                    <CoursePublishBadge isPublished={item.course.status === 'ACTIVE'} />
                  </Table.Cell>
                  <Table.Cell class="text-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      class="text-muted-foreground hover:text-destructive"
                      onclick={(event) => {
                        event.stopPropagation();
                        openDeleteModal(item.courseId);
                      }}
                    >
                      <Trash2Icon size={16} />
                    </Button>
                  </Table.Cell>
                </Table.Row>
              {/each}
            </Table.Body>
          </Table.Root>
        </div>
      {:else}
        <div class="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {#each courseCards as course (course.id)}
            <CourseCard course={course as unknown as OrgCourses[number]} href={`/courses/${course.id}`}>
              {#snippet actions()}
                <Button
                  variant="outline"
                  size="icon"
                  class="text-muted-foreground hover:text-destructive absolute! top-6 right-6 z-40"
                  onclick={(event) => {
                    event.stopPropagation();
                    openDeleteModal(course.id);
                  }}
                >
                  <Trash2Icon size={16} />
                </Button>
              {/snippet}
            </CourseCard>
          {/each}
        </div>
      {/if}
    {/snippet}
  </Page.Body>
</Page.Root>

<AddCourseToCohortModal bind:open={showAddCourseModal} cohortId={data.cohortId} />
<DeleteModal bind:open={showDeleteModal} onDelete={handleRemoveCourse} isLoading={cohortApi.isLoading} />
