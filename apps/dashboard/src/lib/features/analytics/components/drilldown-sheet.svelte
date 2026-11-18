<script lang="ts">
  import { resolve } from '$app/paths';
  import CircleAlertIcon from '@lucide/svelte/icons/circle-alert';
  import UsersIcon from '@lucide/svelte/icons/users';
  import { Button } from '@cio/ui/base/button';
  import * as Sheet from '@cio/ui/base/sheet';
  import { Skeleton } from '@cio/ui/base/skeleton';
  import * as Table from '@cio/ui/base/table';
  import { Empty } from '@cio/ui/custom/empty';
  import { cn } from '@cio/ui/tools';
  import { ANALYTICS_LIMITS } from '@cio/utils/constants/analytics';
  import { formatLastSeen } from '$features/audience/utils/audience-utils';
  import { ExportMenu, TablePagination } from '$features/ui';
  import { t } from '$lib/utils/functions/translations';

  import { analyticsApi, analyticsDrilldownApi, analyticsStudentSheetApi, analyticsStudentsApi } from '../api';
  import {
    attemptedByExercise,
    drilldownCourseId,
    drilldownHeading,
    isAnalyticsStatus,
    numberCell,
    scopeCourse,
    studentExportHeaders,
    textCell,
    toSelectedStudent
  } from '../utils/analytics-utils';
  import type { AnalyticsRow } from '../utils/types';
  import AnalyticsPill from './analytics-pill.svelte';
  import DrilldownSegmentSwitcher from './drilldown-segment-switcher.svelte';
  import ProgressCell from './progress-cell.svelte';
  import StatusBadge from './status-badge.svelte';

  const drilldownApi = analyticsDrilldownApi;

  const drilldown = $derived(drilldownApi.drilldown);
  const dashboard = $derived(analyticsApi.dashboard);
  const scopeType = $derived(dashboard?.scope.type ?? 'org');
  const scopeId = $derived(analyticsApi.scope?.id ?? '');
  const isCourseScope = $derived(scopeType === 'course');
  const scopeName = $derived(scopeType === 'org' ? null : (dashboard?.scope.name ?? null));
  const courseId = $derived(drilldown ? drilldownCourseId(drilldown) : null);
  const courseTitle = $derived(courseId && !isCourseScope ? (scopeCourse(dashboard, courseId)?.title ?? null) : null);
  const lessonId = $derived(drilldown?.facet?.kind === 'lesson_incomplete' ? drilldown.facet.lessonId : null);
  const lessonTitle = $derived.by(() => {
    const structureCourseId = courseId ?? dashboard?.scope.courses[0]?.id;
    const items = structureCourseId ? dashboard?.structures[structureCourseId]?.items : undefined;

    return items?.find((item) => item.id === lessonId)?.title ?? null;
  });
  const heading = $derived(
    drilldown ? drilldownHeading({ drilldown, total: drilldownApi.total, scopeName, courseTitle, lessonTitle }, $t) : ''
  );
  const healthKey = $derived(drilldown?.facet?.kind === 'cohort_health' ? (drilldown.facet.health ?? 'any') : null);
  const note = $derived.by(() => {
    if (!drilldown || !drilldownApi.hasLoaded) return null;

    const expected = drilldown.expectedTotal;
    if (expected !== null && expected !== drilldownApi.total) {
      return $t('analytics.drilldown.count_differs', { expected, total: drilldownApi.total });
    }

    return healthKey ? $t('analytics.drilldown.cohort_health_note') : null;
  });
  const studentsTab = $derived(drilldown ? drilldownApi.studentsTabFor(drilldown) : null);

  function handleOpenChange(isOpen: boolean) {
    if (!isOpen) drilldownApi.close();
  }

  function studentId(row: AnalyticsRow): string {
    return String(row['student_id'] ?? '');
  }

  function openStudent(row: AnalyticsRow) {
    const student = toSelectedStudent(row);
    if (!student) return;

    void analyticsStudentSheetApi.openFor(student);
  }

  function loadExportDocument() {
    return analyticsStudentsApi.buildExportDocument({
      filename: `${dashboard?.scope.name ?? ''} ${heading}`.trim(),
      title: heading,
      subtitle: dashboard?.scope.name,
      headers: studentExportHeaders($t),
      attemptedByExercise: attemptedByExercise(analyticsStudentsApi.attemptedResult),
      drilldown: drilldown ? { filters: drilldown.filters, range: drilldown.range } : undefined
    });
  }
</script>

<Sheet.Root open={drilldownApi.isOpen} onOpenChange={handleOpenChange}>
  <Sheet.Content class="w-full sm:max-w-3xl" data-testid="analytics-drilldown-sheet">
    <Sheet.Header>
      {#if drilldownApi.hasLoaded}
        <Sheet.Title data-testid="analytics-drilldown-title">{heading}</Sheet.Title>
      {:else}
        <Sheet.Title><Skeleton class="h-6 w-64" /></Sheet.Title>
      {/if}
      <Sheet.Description>{note ?? $t('analytics.drilldown.description')}</Sheet.Description>
    </Sheet.Header>

    <DrilldownSegmentSwitcher />

    <div class="flex min-h-0 flex-1 flex-col gap-4 overflow-auto px-4 pb-4">
      {#if !drilldownApi.hasLoaded}
        <div class="space-y-2" aria-busy="true">
          {#each [0, 1, 2, 3, 4] as index (index)}
            <Skeleton class="h-11 w-full" />
          {/each}
        </div>
      {:else if drilldownApi.failed}
        <Empty icon={CircleAlertIcon} title={$t('analytics.students.failed')} class="h-[200px]">
          <Button variant="outline" size="sm" onclick={() => drilldownApi.retry()}>{$t('analytics.retry')}</Button>
        </Empty>
      {:else if drilldownApi.rows.length === 0}
        <Empty icon={UsersIcon} title={$t('analytics.students.empty')} class="h-[200px]" />
      {:else}
        <div class={cn('transition-opacity duration-200', drilldownApi.isLoading && 'opacity-60')}>
          <Table.Root>
            <Table.Header>
              <Table.Row>
                <Table.Head>{$t('analytics.columns.student')}</Table.Head>
                <Table.Head class="min-w-[120px]">{$t('analytics.columns.progress')}</Table.Head>
                <Table.Head class="text-center">{$t('analytics.columns.average_score')}</Table.Head>
                <Table.Head>{$t('analytics.columns.last_login')}</Table.Head>
                <Table.Head>{$t('analytics.columns.status')}</Table.Head>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {#each drilldownApi.rows as row (studentId(row))}
                {@const status = row['status__value']}
                {@const lastLoginAt = textCell(row, 'last_login_at__value')}
                {@const score = numberCell(row, 'avg_score_pct__value')}
                <Table.Row data-testid="analytics-drilldown-row">
                  <Table.Cell>
                    {#if isCourseScope}
                      <a
                        class="ui:focus-visible:ring-ring flex flex-col items-start rounded text-left focus-visible:ring-2 focus-visible:outline-none"
                        href={resolve(
                          `/courses/${scopeId}/people/${studentId(row)}?back=/courses/${scopeId}/analytics`,
                          {}
                        )}
                      >
                        <span class="font-medium">{textCell(row, 'name__value')}</span>
                        <span class="ui:text-muted-foreground text-xs">{textCell(row, 'email__value')}</span>
                      </a>
                    {:else}
                      <button
                        type="button"
                        class="ui:focus-visible:ring-ring flex flex-col items-start rounded text-left focus-visible:ring-2 focus-visible:outline-none"
                        data-testid="analytics-drilldown-student"
                        onclick={() => openStudent(row)}
                      >
                        <span class="font-medium">{textCell(row, 'name__value')}</span>
                        <span class="ui:text-muted-foreground text-xs">{textCell(row, 'email__value')}</span>
                      </button>
                    {/if}
                  </Table.Cell>
                  <Table.Cell><ProgressCell value={numberCell(row, 'overall_progress_pct__value')} /></Table.Cell>
                  <Table.Cell class="text-center tabular-nums"
                    >{score === null ? '–' : `${Math.round(score)}%`}</Table.Cell
                  >
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

      {#if drilldownApi.hasLoaded && drilldownApi.rows.length > 0}
        <div class="flex flex-wrap items-center justify-between gap-2">
          <div class="flex items-center gap-2">
            <ExportMenu
              document={loadExportDocument}
              estimatedRowCount={drilldownApi.total}
              disabled={drilldownApi.total === 0 || drilldownApi.isLoading}
              testId="analytics-drilldown-export"
            />
            {#if studentsTab && drilldown}
              <Button
                variant="outline"
                size="sm"
                testId="analytics-drilldown-open-students"
                onclick={() => drilldown && drilldownApi.openInStudentsTab(drilldown)}
              >
                {$t('analytics.drilldown.open_in_students')}
              </Button>
            {/if}
          </div>
        </div>
        {#if drilldownApi.pageCount > 1}
          <TablePagination
            count={drilldownApi.total}
            perPage={ANALYTICS_LIMITS.studentsPageSize}
            page={drilldownApi.page}
            onPageChange={(page) => drilldownApi.goToPage(page)}
          />
        {/if}
      {/if}
    </div>
  </Sheet.Content>
</Sheet.Root>
