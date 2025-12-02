<script lang="ts">
  import { goto } from '$app/navigation';
  import { Badge } from '@cio/ui/base/badge';
  import UserIcon from '@lucide/svelte/icons/user';
  import * as Pagination from '@cio/ui/base/pagination';

  import { course } from '../../store';
  import { t } from '$lib/utils/functions/translations';

  import EmptyState from './EmptyState.svelte';
  import * as Avatar from '@cio/ui/base/avatar';
  import type { StudentOverview } from '$lib/utils/types/analytics';
  import { shortenName } from '$lib/utils/functions/string';

  interface Props {
    students?: StudentOverview[];
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

  const GotoFullProfile = (student: StudentOverview) => {
    if (!student) return;

    goto(`/courses/${$course.id}/people/${student.id}?back=/courses/${$course.id}/analytics`);
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
  <div class="relative h-[300px] overflow-hidden">
    <div class="h-full overflow-auto">
      <table class="w-full min-w-[800px]">
        <!-- Fixed Header -->
        <thead class="sticky top-0 z-10 bg-white dark:bg-neutral-800">
          <tr class="border-b border-gray-200 dark:border-neutral-600">
            <th
              class="sticky left-0 top-0 z-20 min-w-[200px] whitespace-nowrap bg-white px-4 py-3 text-left text-sm font-medium text-gray-500 dark:bg-neutral-800 dark:text-gray-300"
            >
              {$t('analytics.student_name')}
            </th>
            <th
              class="min-w-[150px] whitespace-nowrap px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-300"
            >
              {$t('analytics.lessons_completed')}
            </th>
            <th
              class="min-w-[140px] whitespace-nowrap px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-300"
            >
              {$t('analytics.exercises_submitted')}
            </th>
            <th
              class="min-w-[120px] whitespace-nowrap px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-300"
            >
              {$t('analytics.average_grade')}
            </th>
            <th
              class="min-w-[120px] whitespace-nowrap px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-300"
            >
              {$t('analytics.last_seen')}
            </th>
            <th
              class="min-w-[120px] whitespace-nowrap px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-300"
            >
              {$t('analytics.actions')}
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200 dark:divide-gray-600">
          {#each paginatedStudents as student}
            <tr class="group h-[100px] border-b hover:bg-gray-50 dark:hover:bg-gray-700">
              <!-- Fixed Name Column -->
              <td
                class="sticky left-0 z-10 min-w-[200px] whitespace-nowrap bg-white px-4 py-3 transition-colors group-hover:bg-gray-50 dark:bg-neutral-800 dark:group-hover:bg-gray-700"
              >
                <div class="flex items-center gap-3">
                  <Avatar.Root class="size-8">
                    <Avatar.Image
                      src={student.profile.avatar_url ? student.profile.avatar_url : '/logo-192.png'}
                      alt={student.profile.fullname ? student.profile.fullname : 'Student'}
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
              </td>
              <!-- Scrollable Content -->
              <td class="min-w-[150px] whitespace-nowrap px-4 py-3">
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
              </td>
              <td class="min-w-[140px] whitespace-nowrap px-4 py-3">
                <span class="text-sm font-medium text-gray-900 dark:text-white">
                  {student.exercisesSubmitted} out of {student.totalExercises}
                </span>
              </td>
              <td class="min-w-[120px] whitespace-nowrap px-4 py-3">
                <Badge
                  class={student.averageGrade >= 80
                    ? 'bg-green-600'
                    : student.averageGrade >= 60
                      ? 'bg-blue-600'
                      : 'bg-red-600'}
                >
                  {student.averageGrade}%
                </Badge>
              </td>
              <td class="min-w-[120px] whitespace-nowrap px-4 py-3">
                <span class="text-sm text-gray-500 dark:text-gray-400">
                  {student.lastSeen}
                </span>
              </td>
              <td class="min-w-[120px] whitespace-nowrap px-4 py-3">
                <button
                  class="whitespace-nowrap rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                  onclick={() => GotoFullProfile(student)}
                >
                  {$t('analytics.view_details')}
                </button>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </div>

  <!-- Pagination Controls -->
  {#if students.length > pageSize}
    <div class="mt-4 flex items-center justify-between border-t border-gray-200 px-4 py-3 dark:border-neutral-600">
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
