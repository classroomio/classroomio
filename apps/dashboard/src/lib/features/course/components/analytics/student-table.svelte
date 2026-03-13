<script lang="ts">
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { Badge } from '@cio/ui/base/badge';
  import { Button } from '@cio/ui/base/button';
  import UserIcon from '@lucide/svelte/icons/user';
  import * as Pagination from '@cio/ui/base/pagination';
  import * as Table from '@cio/ui/base/table';

  import { courseApi } from '$features/course/api';
  import { t } from '$lib/utils/functions/translations';

  import EmptyState from './empty-state.svelte';
  import * as Avatar from '@cio/ui/base/avatar';
  import type { CourseAnalytics } from '$features/course/utils/types';
  import { shortenName } from '$lib/utils/functions/string';

  interface Props {
    students?: CourseAnalytics['students'];
  }

  let { students = [] }: Props = $props();

  // Pagination state
  let currentPage = $state(1);
  const pageSize = 15;

  // Computed values
  let totalPages = $derived(Math.ceil(students.length / pageSize));
  let startIndex = $derived((currentPage - 1) * pageSize);
  let endIndex = $derived(startIndex + pageSize);
  let paginatedStudents = $derived(students.slice(startIndex, endIndex));
  let startItem = $derived(startIndex + 1);
  let endItem = $derived(Math.min(endIndex, students.length));

  const GotoFullProfile = (student: CourseAnalytics['students'][number]) => {
    if (!student) return;

    goto(
      resolve(`/courses/${courseApi.course?.id}/people/${student.id}?back=/courses/${courseApi.course?.id}/analytics`)
    );
  };

  // Reset to first page when students array changes
  $effect(() => {
    if (students.length > 0 && currentPage > totalPages) {
      currentPage = 1;
    }
  });
</script>

{#if students.length === 0}
  <EmptyState
    title={$t('analytics.no_students_found')}
    description={$t('analytics.no_students_description')}
    icon={UserIcon}
  />
{:else}
  <!-- Responsive Table -->
  <div class="relative h-[300px] overflow-auto rounded-md border">
    <Table.Root class="min-w-[800px]">
      <Table.Header class="sticky top-0 z-10 bg-white dark:bg-neutral-800">
        <Table.Row>
          <Table.Head class="sticky top-0 left-0 z-20 min-w-[200px] bg-white px-4 py-3 dark:bg-neutral-800">
            {$t('analytics.student_name')}
          </Table.Head>
          <Table.Head class="min-w-[150px] px-4 py-3">{$t('analytics.lessons_completed')}</Table.Head>
          <Table.Head class="min-w-[140px] px-4 py-3">{$t('analytics.exercises_submitted')}</Table.Head>
          <Table.Head class="min-w-[120px] px-4 py-3">{$t('analytics.average_grade')}</Table.Head>
          <Table.Head class="min-w-[120px] px-4 py-3">{$t('analytics.last_seen')}</Table.Head>
          <Table.Head class="min-w-[120px] px-4 py-3">{$t('analytics.actions')}</Table.Head>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {#each paginatedStudents as student (student.id)}
          <Table.Row class="group h-[100px]">
            <Table.Cell
              class="sticky left-0 z-10 min-w-[200px] bg-white px-4 py-3 transition-colors group-hover:bg-gray-50 dark:bg-neutral-800 dark:group-hover:bg-gray-700"
            >
              <div class="flex items-center gap-3">
                <Avatar.Root class="size-8">
                  <Avatar.Image
                    src={student.profile.avatar_url ? student.profile.avatar_url : '/logo-192.png'}
                    alt={student.profile.fullname ? student.profile.fullname : $t('analytics.student')}
                  />
                  <Avatar.Fallback>{shortenName(student.profile.fullname) || 'S'}</Avatar.Fallback>
                </Avatar.Root>
                <div class="min-w-0 flex-1">
                  <p class="truncate font-medium text-gray-900 dark:text-white">
                    {student.profile.fullname}
                  </p>
                  <p class="truncate text-sm text-gray-500 dark:text-gray-400">
                    {student.profile.email}
                  </p>
                </div>
              </div>
            </Table.Cell>
            <Table.Cell class="min-w-[150px] px-4 py-3">
              <div class="flex items-center gap-3">
                <span class="text-sm font-medium text-gray-900 dark:text-white">
                  {student.lessonsCompleted}/{student.totalLessons}
                </span>
                <div class="w-20 flex-shrink-0">
                  <div class="h-2 rounded-full bg-gray-200 dark:bg-neutral-700">
                    <div class="h-2 rounded-full bg-blue-500" style="width: {student.progressPercentage}%"></div>
                  </div>
                </div>
              </div>
            </Table.Cell>
            <Table.Cell class="min-w-[140px] px-4 py-3">
              <span class="text-sm font-medium text-gray-900 dark:text-white">
                {student.exercisesSubmitted} out of {student.totalExercises}
              </span>
            </Table.Cell>
            <Table.Cell class="min-w-[120px] px-4 py-3">
              <Badge
                class={student.averageGrade >= 80
                  ? 'bg-green-600'
                  : student.averageGrade >= 60
                    ? 'bg-blue-600'
                    : 'bg-red-600'}
              >
                {student.averageGrade}%
              </Badge>
            </Table.Cell>
            <Table.Cell class="min-w-[120px] px-4 py-3">
              <span class="text-sm text-gray-500 dark:text-gray-400">
                {student.lastSeen}
              </span>
            </Table.Cell>
            <Table.Cell class="min-w-[120px] px-4 py-3">
              <Button variant="outline" size="sm" onclick={() => GotoFullProfile(student)}>
                {$t('analytics.view_details')}
              </Button>
            </Table.Cell>
          </Table.Row>
        {/each}
      </Table.Body>
    </Table.Root>
  </div>

  <!-- Pagination Controls -->
  {#if students.length > pageSize}
    <div class="mt-4 flex items-center justify-between border-t border-gray-200 px-4 py-3">
      <div class="text-sm text-gray-700 dark:text-gray-300">
        {$t('analytics.showing_students', {
          start: startItem,
          end: endItem,
          total: students.length
        })}
      </div>

      <Pagination.Root
        count={students.length}
        perPage={pageSize}
        page={currentPage}
        onPageChange={(page) => (currentPage = page)}
      >
        {#snippet children({ pages, currentPage: activePage })}
          <Pagination.Content>
            <Pagination.Item>
              <Pagination.PrevButton />
            </Pagination.Item>
            {#each pages as page (page.key)}
              {#if page.type === 'ellipsis'}
                <Pagination.Item>
                  <Pagination.Ellipsis />
                </Pagination.Item>
              {:else}
                <Pagination.Item>
                  <Pagination.Link {page} isActive={activePage === page.value}>
                    {page.value}
                  </Pagination.Link>
                </Pagination.Item>
              {/if}
            {/each}
            <Pagination.Item>
              <Pagination.NextButton />
            </Pagination.Item>
          </Pagination.Content>
        {/snippet}
      </Pagination.Root>
    </div>
  {/if}
{/if}
