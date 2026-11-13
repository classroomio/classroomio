<script lang="ts">
  import { resolve } from '$app/paths';
  import CircleAlertIcon from '@lucide/svelte/icons/circle-alert';
  import UsersIcon from '@lucide/svelte/icons/users';
  import { Button } from '@cio/ui/base/button';
  import { Skeleton } from '@cio/ui/base/skeleton';
  import * as Table from '@cio/ui/base/table';
  import { Empty } from '@cio/ui/custom/empty';
  import { cn } from '@cio/ui/tools';
  import { ANALYTICS_LIMITS } from '@cio/utils/constants/analytics';
  import { formatLastSeen } from '$features/audience/utils/audience-utils';
  import { ExportMenu, TablePagination } from '$features/ui';
  import { t } from '$lib/utils/functions/translations';

  import { analyticsApi, analyticsStudentsApi, analyticsStudentSheetApi } from '../../api';
  import {
    attemptedByExercise,
    formatPercent,
    isAnalyticsStatus,
    nowAtLabel,
    numberCell,
    studentFooterLabel,
    studentPageRange,
    textCell,
    toSelectedStudent,
    visibleExerciseColumns
  } from '../../utils/analytics-utils';
  import type { AnalyticsRow } from '../../utils/types';
  import HeatCell from '../heat-cell.svelte';
  import AnalyticsPill from '../analytics-pill.svelte';
  import PassMarkTag from '../pass-mark-tag.svelte';
  import ProgressCell from '../progress-cell.svelte';
  import ScoreCell from '../score-cell.svelte';
  import Sparkline from '../sparkline.svelte';
  import SortableHead from '../sortable-head.svelte';
  import StatusBadge from '../status-badge.svelte';
  import StudentsToolbar from './students-toolbar.svelte';
  import StudentSheet from './student-sheet.svelte';

  const courseId = $derived(analyticsApi.selection.courseId);
  const structure = $derived(courseId ? analyticsApi.dashboard?.structures[courseId] : undefined);
  const attempted = $derived(attemptedByExercise(analyticsStudentsApi.attemptedResult));
  const exercises = $derived(courseId ? visibleExerciseColumns(structure, attempted) : []);
  const scopeTitle = $derived(analyticsApi.dashboard?.scope.name ?? '');
  const scopeType = $derived(analyticsApi.dashboard?.scope.type ?? 'cohort');
  const isCourseScope = $derived(scopeType === 'course');
  const scopeStudentCount = $derived(analyticsApi.dashboard?.scope.studentCount ?? 0);
  const pageRange = $derived(studentPageRange(analyticsStudentsApi.page, analyticsStudentsApi.rows.length));
  const footerLabel = $derived(
    studentFooterLabel(
      {
        pageCount: analyticsStudentsApi.pageCount,
        total: analyticsStudentsApi.total,
        count: scopeStudentCount,
        from: pageRange.from,
        to: pageRange.to,
        scopeType
      },
      $t
    )
  );

  function studentId(row: AnalyticsRow): string {
    return String(row['student_id'] ?? '');
  }

  function handleSort(key: string) {
    void analyticsStudentsApi.setSort(key);
  }

  function retryLoad() {
    void analyticsStudentsApi.retry();
  }

  function selectStudent(row: AnalyticsRow) {
    const student = toSelectedStudent(row);
    if (!student || isCourseScope) return;

    void analyticsStudentSheetApi.openFor(student);
  }

  function handleNameClick(event: MouseEvent, row: AnalyticsRow) {
    event.stopPropagation();
    selectStudent(row);
  }

  function trend(row: AnalyticsRow): Array<number | null> {
    const cells = analyticsStudentsApi.cells[studentId(row)] ?? {};

    return exercises.map((exercise) => cells[exercise.id]?.scorePct ?? null);
  }

  function loadExportDocument() {
    return analyticsStudentsApi.buildExportDocument({
      filename: `${scopeTitle} students`,
      title: scopeTitle,
      headers: {
        name: $t('analytics.columns.student'),
        email: $t('analytics.columns.email'),
        progress: $t('analytics.columns.progress'),
        nowAt: $t('analytics.columns.now_at'),
        finished: $t('analytics.finished'),
        averageScore: $t('analytics.columns.average_score'),
        coursesCompleted: $t('analytics.columns.courses_completed'),
        video: $t('analytics.columns.video'),
        classroom: $t('analytics.columns.classroom'),
        certificates: $t('analytics.columns.certificates'),
        lastLogin: $t('analytics.columns.last_login'),
        status: $t('analytics.columns.status'),
        statusLabels: {
          at_risk: $t('analytics.status.at_risk'),
          lagging: $t('analytics.status.lagging'),
          on_track: $t('analytics.status.on_track'),
          completed: $t('analytics.status.completed')
        }
      },
      attemptedByExercise: attempted
    });
  }
</script>

<div class="space-y-4">
  <StudentsToolbar />

  {#if !analyticsStudentsApi.hasLoaded}
    <div class="space-y-2" aria-busy="true">
      {#each [0, 1, 2, 3, 4, 5] as index (index)}
        <Skeleton class="h-11 w-full" />
      {/each}
    </div>
  {:else if analyticsStudentsApi.failed}
    <Empty icon={CircleAlertIcon} title={$t('analytics.students.failed')} class="h-[200px]">
      <Button variant="outline" size="sm" onclick={retryLoad}>{$t('analytics.retry')}</Button>
    </Empty>
  {:else if analyticsStudentsApi.cellsFailed}
    <Empty icon={CircleAlertIcon} title={$t('analytics.students.cells_failed')} class="h-[200px]">
      <Button variant="outline" size="sm" onclick={retryLoad}>{$t('analytics.retry')}</Button>
    </Empty>
  {:else if analyticsStudentsApi.rows.length === 0}
    <Empty
      icon={UsersIcon}
      title={scopeStudentCount === 0 ? $t('analytics.no_students_yet') : $t('analytics.students.empty')}
      class="h-[200px]"
    />
  {:else}
    {#if analyticsStudentsApi.attemptedFailed}
      <p class="ui:text-muted-foreground flex items-center gap-1.5 text-xs">
        <CircleAlertIcon class="size-3.5" />
        {$t('analytics.students.attempts_unavailable')}
      </p>
    {/if}
    <div class={cn('transition-opacity duration-200', analyticsStudentsApi.loadingPage && 'opacity-60')}>
      <Table.Root>
        <Table.Header>
          <Table.Row>
            <SortableHead
              label={$t('analytics.columns.student')}
              sortKey="student"
              sort={analyticsStudentsApi.sort}
              onSort={handleSort}
              class="ui:bg-background sticky left-0 z-10 min-w-[200px]"
            />
            <SortableHead
              label={$t('analytics.columns.progress')}
              sortKey="overall_progress_pct__value"
              sort={analyticsStudentsApi.sort}
              onSort={handleSort}
              class="min-w-[140px]"
            />
            {#if courseId}
              <Table.Head class="min-w-[140px]">{$t('analytics.columns.now_at')}</Table.Head>
              {#each exercises as exercise (exercise.id)}
                <Table.Head class="min-w-[96px] text-center">
                  <div class="flex flex-col items-center gap-1">
                    <span class="line-clamp-2 text-xs" title={exercise.title}>{exercise.title}</span>
                    {#if exercise.passMark !== null}
                      <PassMarkTag passMark={exercise.passMark} />
                    {/if}
                  </div>
                </Table.Head>
              {/each}
              <Table.Head>{$t('analytics.columns.trend')}</Table.Head>
            {:else}
              <SortableHead
                label={$t('analytics.columns.average_score')}
                sortKey="avg_score_pct__value"
                sort={analyticsStudentsApi.sort}
                onSort={handleSort}
                align="center"
              />
              <SortableHead
                label={$t('analytics.columns.courses_completed')}
                sortKey="courses_completed__value"
                sort={analyticsStudentsApi.sort}
                onSort={handleSort}
                align="center"
              />
            {/if}
            <SortableHead
              label={$t('analytics.columns.video')}
              sortKey="video_pct__value"
              sort={analyticsStudentsApi.sort}
              onSort={handleSort}
              align="center"
            />
            <SortableHead
              label={$t('analytics.columns.classroom')}
              sortKey="attendance_pct__value"
              sort={analyticsStudentsApi.sort}
              onSort={handleSort}
              align="center"
            />
            <SortableHead
              label={$t('analytics.columns.certificate')}
              sortKey="certificates__value"
              sort={analyticsStudentsApi.sort}
              onSort={handleSort}
              align="center"
            />
            <SortableHead
              label={$t('analytics.columns.last_login')}
              sortKey="last_login_at__value"
              sort={analyticsStudentsApi.sort}
              onSort={handleSort}
            />
            <SortableHead
              label={$t('analytics.columns.status')}
              sortKey="status_rank__value"
              sort={analyticsStudentsApi.sort}
              onSort={handleSort}
            />
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {#each analyticsStudentsApi.rows as row (studentId(row))}
            {@const isSelected =
              analyticsStudentSheetApi.isOpen && analyticsStudentSheetApi.student?.id === studentId(row)}
            {@const progress = numberCell(row, 'overall_progress_pct__value')}
            {@const status = row['status__value']}
            {@const lastLoginAt = textCell(row, 'last_login_at__value')}
            {@const certificates = numberCell(row, 'certificates__value') ?? 0}
            <Table.Row
              class={cn(!isCourseScope && 'cursor-pointer', isSelected && 'ui:bg-muted/60')}
              aria-selected={isCourseScope ? undefined : isSelected}
              onclick={() => selectStudent(row)}
            >
              <Table.Cell class="ui:bg-background sticky left-0 z-10">
                {#if isCourseScope && courseId}
                  <a
                    class="ui:focus-visible:ring-ring flex w-full flex-col items-start rounded text-left focus-visible:ring-2 focus-visible:outline-none"
                    href={resolve(
                      `/courses/${courseId}/people/${studentId(row)}?back=/courses/${courseId}/analytics`,
                      {}
                    )}
                  >
                    <span class="font-medium">{textCell(row, 'name__value')}</span>
                    <span class="ui:text-muted-foreground text-xs">{textCell(row, 'email__value')}</span>
                  </a>
                {:else}
                  <button
                    type="button"
                    class="ui:focus-visible:ring-ring flex w-full flex-col items-start rounded text-left focus-visible:ring-2 focus-visible:outline-none"
                    onclick={(event) => handleNameClick(event, row)}
                  >
                    <span class="font-medium">{textCell(row, 'name__value')}</span>
                    <span class="ui:text-muted-foreground text-xs">{textCell(row, 'email__value')}</span>
                  </button>
                {/if}
              </Table.Cell>
              <Table.Cell><ProgressCell value={progress} /></Table.Cell>
              {#if courseId}
                <Table.Cell class="ui:text-muted-foreground text-xs">
                  {nowAtLabel(progress, textCell(row, 'now_at_title__value'), $t)}
                </Table.Cell>
                {#each exercises as exercise (exercise.id)}
                  <Table.Cell class="text-center">
                    <ScoreCell
                      cell={analyticsStudentsApi.cells[studentId(row)]?.[exercise.id]}
                      passMark={exercise.passMark}
                    />
                  </Table.Cell>
                {/each}
                <Table.Cell>
                  <Sparkline values={trend(row)} label={$t('analytics.columns.trend')} />
                </Table.Cell>
              {:else}
                {@const coursesCompleted = numberCell(row, 'courses_completed__value') ?? 0}
                {@const coursesTotal = numberCell(row, 'courses_total__value') ?? 0}
                <Table.Cell class="text-center"><HeatCell value={row['avg_score_pct__value']} /></Table.Cell>
                <Table.Cell class="text-center tabular-nums">
                  {$t('analytics.of_total', { count: coursesCompleted, total: coursesTotal })}
                </Table.Cell>
              {/if}
              <Table.Cell class="text-center tabular-nums">{formatPercent(row['video_pct__value'])}</Table.Cell>
              <Table.Cell class="text-center tabular-nums">{formatPercent(row['attendance_pct__value'])}</Table.Cell>
              <Table.Cell class="text-center">
                {#if certificates > 0}
                  <AnalyticsPill tone="done"
                    >{$t('analytics.certificate_issued', { count: certificates })}</AnalyticsPill
                  >
                {:else}
                  <span class="ui:text-muted-foreground">–</span>
                {/if}
              </Table.Cell>
              <Table.Cell class="ui:text-muted-foreground text-xs whitespace-nowrap">
                {lastLoginAt ? formatLastSeen(lastLoginAt) : $t('analytics.never')}
              </Table.Cell>
              <Table.Cell>
                <div class="flex flex-wrap items-center gap-1">
                  {#if isAnalyticsStatus(status)}
                    <StatusBadge {status} />
                  {/if}
                  {#if row['is_overdue__value'] === true}
                    <AnalyticsPill tone="risk">{$t('analytics.flags.overdue')}</AnalyticsPill>
                  {/if}
                </div>
              </Table.Cell>
            </Table.Row>
          {/each}
        </Table.Body>
      </Table.Root>
    </div>
  {/if}

  {#if analyticsStudentsApi.rows.length > 0}
    <div class="flex flex-col items-center justify-between gap-2 sm:flex-row">
      {#if footerLabel}
        <p class="ui:text-muted-foreground text-xs">{footerLabel}</p>
      {:else}
        <span></span>
      {/if}
      <ExportMenu
        document={loadExportDocument}
        estimatedRowCount={analyticsStudentsApi.total}
        disabled={analyticsStudentsApi.total === 0 || analyticsStudentsApi.loadingPage}
        testId="analytics-students-export"
      />
    </div>
  {/if}

  {#if analyticsStudentsApi.pageCount > 1}
    <TablePagination
      count={analyticsStudentsApi.total}
      perPage={ANALYTICS_LIMITS.studentsPageSize}
      page={analyticsStudentsApi.page}
      onPageChange={(page) => analyticsStudentsApi.goToPage(page)}
    />
  {/if}

  {#if !isCourseScope}
    <StudentSheet />
  {/if}
</div>
