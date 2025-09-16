<script lang="ts">
  import Avatar from '$lib/components/Avatar/index.svelte';
  import { Tag, Pagination } from 'carbon-components-svelte';
  import type { StudentOverview } from '$lib/utils/types/analytics';
  import EmptyState from './EmptyState.svelte';
  import { User } from 'carbon-icons-svelte';
  import { course } from '../../store';
  import { goto } from '$app/navigation';

  export let students: StudentOverview[] = [];

  // Pagination state
  let currentPage = 1;
  const pageSize = 15;

  // Computed values
  $: totalPages = Math.ceil(students.length / pageSize);
  $: startIndex = (currentPage - 1) * pageSize;
  $: endIndex = startIndex + pageSize;
  $: paginatedStudents = students.slice(startIndex, endIndex);
  $: startItem = startIndex + 1;
  $: endItem = Math.min(endIndex, students.length);

  const GotoFullProfile = (student: StudentOverview) => {
    if (!student) return;
    goto(`/courses/${$course.id}/people/${student.id}?back=/courses/${$course.id}/analytics`);
  };

  function handlePageChange(event: CustomEvent) {
    currentPage = event.detail.page;
  }

  // Reset to first page when students array changes
  $: if (students.length > 0 && currentPage > totalPages) {
    currentPage = 1;
  }
</script>

{#if students.length === 0}
  <EmptyState
    title="No Students Found"
    description="There are no students enrolled in this course yet. Students will appear here once they join the course."
    icon={User}
  />
{:else}
  <!-- Responsive Table -->
  <div class="relative h-[600px] overflow-hidden">
    <div class="h-full overflow-auto">
      <table class="w-full min-w-[800px]">
        <!-- Fixed Header -->
        <thead class="sticky top-0 z-10 bg-white dark:bg-gray-800">
          <tr class="border-b border-gray-200 dark:border-gray-600">
            <th
              class="sticky left-0 z-20 min-w-[200px] whitespace-nowrap bg-white px-4 py-3 text-left text-sm font-medium text-gray-500 dark:bg-gray-800 dark:text-gray-300"
            >
              Student Name
            </th>
            <th
              class="min-w-[150px] whitespace-nowrap px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-300"
            >
              Lessons Completed
            </th>
            <th
              class="min-w-[140px] whitespace-nowrap px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-300"
            >
              Exercises Submitted
            </th>
            <th
              class="min-w-[120px] whitespace-nowrap px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-300"
            >
              Average Grade
            </th>
            <th
              class="min-w-[120px] whitespace-nowrap px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-300"
            >
              Last Seen
            </th>
            <th
              class="min-w-[120px] whitespace-nowrap px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-300"
            >
              Actions
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200 dark:divide-gray-600">
          {#each paginatedStudents as student}
            <tr class="group h-[100px] border-b hover:bg-gray-50 dark:hover:bg-gray-700">
              <!-- Fixed Name Column -->
              <td
                class="sticky left-0 z-10 min-w-[200px] whitespace-nowrap bg-white px-4 py-3 transition-colors group-hover:bg-gray-50 dark:bg-gray-800 dark:group-hover:bg-gray-700"
              >
                <div class="flex items-center gap-3">
                  <Avatar
                    src={student.profile.avatar_url}
                    name={student.profile.fullname}
                    width="w-8"
                    height="h-8"
                  />
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
                    <div class="h-2 rounded-full bg-gray-200 dark:bg-gray-700">
                      <div
                        class="h-2 rounded-full bg-blue-500"
                        style="width: {student.progressPercentage}%"
                      ></div>
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
                <Tag
                  type={student.averageGrade >= 80
                    ? 'green'
                    : student.averageGrade >= 60
                      ? 'blue'
                      : 'red'}
                  size="sm"
                >
                  {student.averageGrade}%
                </Tag>
              </td>
              <td class="min-w-[120px] whitespace-nowrap px-4 py-3">
                <span class="text-sm text-gray-500 dark:text-gray-400">
                  {student.lastSeen}
                </span>
              </td>
              <td class="min-w-[120px] whitespace-nowrap px-4 py-3">
                <button
                  class="whitespace-nowrap rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                  on:click={() => GotoFullProfile(student)}
                >
                  View Details
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
    <div
      class="mt-4 flex items-center justify-between border-t border-gray-200 px-4 py-3 dark:border-gray-600"
    >
      <div class="text-sm text-gray-700 dark:text-gray-300">
        Showing {startItem} to {endItem} of {students.length} students
      </div>
      <Pagination
        page={currentPage}
        totalItems={students.length}
        {pageSize}
        on:change={handlePageChange}
      />
    </div>
  {/if}
{/if}
