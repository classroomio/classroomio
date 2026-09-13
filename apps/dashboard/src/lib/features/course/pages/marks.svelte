<script lang="ts">
  import { Empty } from '@cio/ui/custom/empty';
  import UserXIcon from '@lucide/svelte/icons/user-x';
  import { UserAvatar } from '@cio/ui/custom/user-avatar';
  import * as Table from '@cio/ui/base/table';
  import * as Tooltip from '@cio/ui/base/tooltip';
  import { t } from '$lib/utils/functions/translations';
  import { calculateStudentAverage, type MarksPageData, type ExerciseInfo } from '$features/course/utils/marks-utils';
  import TruncatedWithTooltip from '$features/course/components/truncated-with-tooltip.svelte';

  interface Props {
    marksData: MarksPageData | null;
  }

  let { marksData }: Props = $props();

  const students = $derived(marksData?.students ?? []);
  const exercises = $derived(marksData?.exercises ?? []);
  const studentMarksByExerciseId = $derived(marksData?.studentMarksByExerciseId ?? {});

  function gradePercent(pointsStr: string | undefined, exercise: ExerciseInfo): number | null {
    if (pointsStr == null || exercise.points === 0) return null;
    const n = parseInt(pointsStr, 10);
    if (Number.isNaN(n)) return null;
    return Math.round((n / exercise.points) * 100);
  }

  /** Text and background classes for grade cells (faint tint + matching text) */
  function gradeCellClass(percent: number | null): string {
    if (percent == null) return 'bg-transparent ui:text-muted-foreground';
    if (percent >= 90) return 'bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400';
    if (percent >= 80) return 'bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400';
    if (percent >= 70) return 'bg-amber-50 text-amber-800 dark:bg-amber-950/30 dark:text-amber-400';
    return 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400';
  }
</script>

{#if students.length > 0}
  <div class="rounded-md border border-gray-300 dark:border-neutral-600">
    <Tooltip.Provider>
      <Table.Root class="">
        <Table.Header>
          <Table.Row class="border-b-2 border-gray-200 dark:border-neutral-700">
            <Table.Head
              class="ui:text-foreground sticky left-0 z-100! min-w-[200px] border-r border-gray-200 bg-gray-50 px-3 py-3 text-left text-sm font-semibold dark:border-neutral-700 dark:bg-neutral-800/80"
            >
              {$t('course.navItem.marks.student')}
            </Table.Head>
            {#each exercises as exercise}
              <Table.Head
                class="min-w-[100px] border-r border-gray-200 bg-white px-2 py-3 text-center text-sm font-semibold last:border-r-0 dark:border-neutral-700 dark:bg-neutral-900"
              >
                <TruncatedWithTooltip text={exercise.title} maxWidth="100px" />
              </Table.Head>
            {/each}
            <Table.Head
              class="min-w-[90px] border-gray-200 bg-white px-2 py-3 text-center text-sm font-semibold dark:border-neutral-700 dark:bg-neutral-900"
            >
              {$t('course.navItem.marks.avg_grade')}
            </Table.Head>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {#each students as student}
            {@const marks = studentMarksByExerciseId[student.id]}
            {@const avg = calculateStudentAverage(marks, exercises)}
            <Table.Row class="border-b border-gray-100 dark:border-neutral-800">
              <Table.Cell
                class="sticky left-0 min-w-[200px] border-r border-gray-200 bg-gray-50 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-800/80"
              >
                <div class="flex items-center gap-2">
                  <UserAvatar
                    src={student.profile?.avatarUrl}
                    alt={student.profile?.fullname ?? 'Student'}
                    class="size-6! shrink-0"
                  />
                  <div class="min-w-0 flex-1">
                    <p class="ui:text-foreground truncate text-sm font-medium">
                      {student.profile?.fullname ?? '-'}
                    </p>
                  </div>
                </div>
              </Table.Cell>
              {#each exercises as exercise}
                {@const pointsStr = marks?.[exercise.id]}
                {@const pct = gradePercent(pointsStr, exercise)}
                <Table.Cell
                  class="min-w-[100px] border-r border-gray-100 px-2 py-2 text-center text-sm dark:border-neutral-800 {gradeCellClass(
                    pct
                  )}"
                >
                  <span class="font-medium">
                    {pct != null ? pct : pointsStr != null ? pointsStr : '-'}
                  </span>
                </Table.Cell>
              {/each}
              <Table.Cell class="min-w-[90px] px-2 py-2 text-center text-sm {gradeCellClass(avg ?? null)}">
                <span class="font-medium">
                  {avg != null ? avg : '-'}
                </span>
              </Table.Cell>
            </Table.Row>
          {/each}
        </Table.Body>
      </Table.Root>
    </Tooltip.Provider>
  </div>
{:else}
  <Empty title={$t('course.navItem.marks.no_student')} icon={UserXIcon} variant="page" />
{/if}
