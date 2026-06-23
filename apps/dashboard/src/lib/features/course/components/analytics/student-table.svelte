<script lang="ts">
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { Badge } from '@cio/ui/base/badge';
  import { Button } from '@cio/ui/base/button';
  import UserIcon from '@lucide/svelte/icons/user';
  import * as Pagination from '@cio/ui/base/pagination';
  import * as Table from '@cio/ui/base/table';

  import { courseApi } from '$features/course/api';
  import { calDateDiff } from '$lib/utils/functions/date';
  import { t } from '$lib/utils/functions/translations';

  import EmptyState from './empty-state.svelte';
  import { UserAvatar } from '@cio/ui/custom/user-avatar';
  import type { CourseAnalytics } from '$features/course/utils/types';

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
      resolve(
        `/courses/${courseApi.course?.id}/people/${student.id}?back=/courses/${courseApi.course?.id}/analytics`,
        {}
      )
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
  <div class="ui:border-border relative max-h-[min(480px,70vh)] overflow-auto rounded-md border">
    <Table.Root class="min-w-[800px]">
      <Table.Header class="ui:bg-muted/80 sticky top-0 z-10 backdrop-blur-sm">
        <Table.Row>
          <Table.Head class="ui:bg-muted/95 sticky top-0 left-0 z-20 min-w-[200px] px-4 py-3 backdrop-blur-sm">
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
              class="ui:bg-card group-hover:ui:bg-muted/50 sticky left-0 z-10 min-w-[200px] px-4 py-3 transition-colors"
            >
              <div class="flex items-center gap-3">
                <UserAvatar
                  src={student.profile.avatar_url}
                  alt={student.profile.fullname ?? $t('analytics.student')}
                  class="size-8"
                />
                <div class="min-w-0 flex-1">
                  <p class="ui:text-foreground truncate font-medium">
                    {student.profile.fullname}
                  </p>
                  <p class="ui:text-muted-foreground truncate text-sm">
                    {student.profile.email}
                  </p>
                </div>
              </div>
            </Table.Cell>
            <Table.Cell class="min-w-[150px] px-4 py-3">
              <div class="flex items-center gap-3">
                <span class="ui:text-foreground text-sm font-medium">
                  {student.lessonsCompleted}/{student.totalLessons}
                </span>
                <div class="w-20 flex-shrink-0">
                  <div class="ui:bg-muted h-2 rounded-full">
                    <div class="h-2 rounded-full bg-blue-500" style="width: {student.progressPercentage}%"></div>
                  </div>
                </div>
              </div>
            </Table.Cell>
            <Table.Cell class="min-w-[140px] px-4 py-3">
              <span class="ui:text-foreground text-sm font-medium">
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
              <span class="ui:text-muted-foreground text-sm">
                {student.lastSeen ? calDateDiff(student.lastSeen) : $t('analytics.a_while_ago')}
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
    <div class="ui:border-border mt-4 flex items-center justify-between border-t px-4 py-3">
      <div class="ui:text-muted-foreground text-sm">
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
