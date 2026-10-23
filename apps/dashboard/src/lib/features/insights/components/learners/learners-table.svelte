<script lang="ts">
  import UsersIcon from '@lucide/svelte/icons/users';
  import { Badge } from '@cio/ui/base/badge';
  import { Button } from '@cio/ui/base/button';
  import { Skeleton } from '@cio/ui/base/skeleton';
  import * as Table from '@cio/ui/base/table';
  import { Empty } from '@cio/ui/custom/empty';
  import { cn } from '@cio/ui/tools';
  import { ExportMenu } from '$features/ui';
  import { t } from '$lib/utils/functions/translations';
  import { formatLastSeen } from '$features/audience/utils/audience-utils';

  import { insightsApi, insightsLearnersApi } from '../../api';
  import {
    attemptedByExercise,
    formatPercent,
    isInsightsStatus,
    LEARNER_DETAIL_ELEMENT_ID,
    numberCell,
    textCell,
    visibleExerciseColumns
  } from '../../utils/insights-utils';
  import type { InsightsRow } from '../../utils/types';
  import PassRequiredTag from '../pass-required-tag.svelte';
  import ScoreCell from '../score-cell.svelte';
  import Sparkline from '../sparkline.svelte';
  import StatusBadge from '../status-badge.svelte';
  import LearnersToolbar from './learners-toolbar.svelte';

  const courseId = $derived(insightsApi.selection.courseId);
  const structure = $derived(courseId ? insightsApi.dashboard?.structures[courseId] : undefined);
  const attempted = $derived(attemptedByExercise(insightsApi.widgetResult('scores_by_exercise')));
  const exercises = $derived(courseId ? visibleExerciseColumns(structure, attempted) : []);
  const scopeTitle = $derived(insightsApi.dashboard?.scope.name ?? '');
  const isCourseScope = $derived(insightsApi.dashboard?.scope.type === 'course');

  function learnerId(row: InsightsRow): string {
    return String(row['learner_id'] ?? '');
  }

  function selectLearner(row: InsightsRow) {
    void insightsApi.selectLearner(learnerId(row));

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    requestAnimationFrame(() =>
      document
        .getElementById(LEARNER_DETAIL_ELEMENT_ID)
        ?.scrollIntoView({ block: 'center', behavior: prefersReducedMotion ? 'auto' : 'smooth' })
    );
  }

  function trend(row: InsightsRow): Array<number | null> {
    const cells = insightsLearnersApi.cells[learnerId(row)] ?? {};

    return exercises.map((exercise) => cells[exercise.id]?.scorePct ?? null);
  }

  function loadExportDocument() {
    return insightsLearnersApi.buildExportDocument({
      filename: `${scopeTitle} learners`,
      title: scopeTitle,
      headers: {
        name: $t('insights.columns.learner'),
        email: $t('insights.columns.email'),
        progress: $t('insights.columns.progress'),
        averageScore: $t('insights.columns.average_score'),
        coursesCompleted: $t('insights.columns.courses_completed'),
        video: $t('insights.columns.video'),
        classroom: $t('insights.columns.classroom'),
        certificates: $t('insights.columns.certificates'),
        lastLogin: $t('insights.columns.last_login'),
        status: $t('insights.columns.status'),
        statusLabels: {
          at_risk: $t('insights.status.at_risk'),
          lagging: $t('insights.status.lagging'),
          on_track: $t('insights.status.on_track'),
          completed: $t('insights.status.completed')
        }
      },
      attemptedByExercise: attempted
    });
  }
</script>

<div class="space-y-4">
  <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
    <LearnersToolbar />
    <ExportMenu
      document={loadExportDocument}
      estimatedRowCount={insightsLearnersApi.total}
      disabled={insightsLearnersApi.total === 0}
      testId="insights-learners-export"
    />
  </div>

  {#if !insightsLearnersApi.hasLoaded}
    <div class="space-y-2" aria-busy="true">
      {#each [0, 1, 2, 3, 4, 5] as index (index)}
        <Skeleton class="h-11 w-full" />
      {/each}
    </div>
  {:else if insightsLearnersApi.rows.length === 0}
    <Empty icon={UsersIcon} title={$t('insights.learners.empty')} class="h-[200px]" />
  {:else}
    <div class={cn('transition-opacity duration-200', insightsLearnersApi.loadingPage && 'opacity-60')}>
      <Table.Root>
        <Table.Header>
          <Table.Row>
            <Table.Head class="ui:bg-background sticky left-0 z-10 min-w-[200px]"
              >{$t('insights.columns.learner')}</Table.Head
            >
            <Table.Head class="min-w-[140px]">{$t('insights.columns.progress')}</Table.Head>
            {#if courseId}
              {#each exercises as exercise (exercise.id)}
                <Table.Head class="min-w-[96px] text-center">
                  <div class="flex flex-col items-center gap-1">
                    <span class="line-clamp-2 text-xs" title={exercise.title}>{exercise.title}</span>
                    {#if exercise.passMark !== null}
                      <PassRequiredTag passMark={exercise.passMark} />
                    {/if}
                  </div>
                </Table.Head>
              {/each}
              <Table.Head>{$t('insights.columns.trend')}</Table.Head>
            {:else}
              <Table.Head class="text-right">{$t('insights.columns.average_score')}</Table.Head>
              <Table.Head class="text-right">{$t('insights.columns.courses_completed')}</Table.Head>
            {/if}
            <Table.Head class="text-right">{$t('insights.columns.video')}</Table.Head>
            <Table.Head class="text-right">{$t('insights.columns.classroom')}</Table.Head>
            <Table.Head>{$t('insights.columns.last_login')}</Table.Head>
            <Table.Head>{$t('insights.columns.status')}</Table.Head>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {#each insightsLearnersApi.rows as row (learnerId(row))}
            {@const isSelected = insightsApi.selection.learnerId === learnerId(row)}
            {@const progress = numberCell(row, 'overall_progress_pct__value') ?? 0}
            {@const status = row['status__value']}
            {@const lastLoginAt = textCell(row, 'last_login_at__value')}
            <Table.Row class={cn(isSelected && 'ui:bg-muted/60')} aria-selected={isSelected}>
              <Table.Cell class="ui:bg-background sticky left-0 z-10">
                {#if isCourseScope && courseId}
                  <a
                    class="ui:focus-visible:ring-ring flex w-full flex-col items-start rounded text-left focus-visible:ring-2 focus-visible:outline-none"
                    href={`/courses/${courseId}/people/${learnerId(row)}?back=/courses/${courseId}/analytics`}
                  >
                    <span class="font-medium">{textCell(row, 'name__value')}</span>
                    <span class="ui:text-muted-foreground text-xs">{textCell(row, 'email__value')}</span>
                  </a>
                {:else}
                  <button
                    type="button"
                    class="ui:focus-visible:ring-ring flex w-full flex-col items-start rounded text-left focus-visible:ring-2 focus-visible:outline-none"
                    onclick={() => selectLearner(row)}
                  >
                    <span class="font-medium">{textCell(row, 'name__value')}</span>
                    <span class="ui:text-muted-foreground text-xs">{textCell(row, 'email__value')}</span>
                  </button>
                {/if}
              </Table.Cell>
              <Table.Cell>
                <div class="flex items-center gap-2">
                  <div class="ui:bg-muted h-2 w-20 overflow-hidden rounded-full">
                    <div class="ui:bg-primary h-full rounded-full" style="width: {Math.min(100, progress)}%"></div>
                  </div>
                  <span class="text-xs tabular-nums">{Math.round(progress)}%</span>
                </div>
              </Table.Cell>
              {#if courseId}
                {#each exercises as exercise (exercise.id)}
                  <Table.Cell class="text-center">
                    <ScoreCell
                      cell={insightsLearnersApi.cells[learnerId(row)]?.[exercise.id]}
                      passMark={exercise.passMark}
                    />
                  </Table.Cell>
                {/each}
                <Table.Cell>
                  <Sparkline values={trend(row)} label={$t('insights.columns.trend')} />
                </Table.Cell>
              {:else}
                {@const coursesCompleted = numberCell(row, 'courses_completed__value') ?? 0}
                {@const coursesTotal = numberCell(row, 'courses_total__value') ?? 0}
                <Table.Cell class="text-right tabular-nums">{formatPercent(row['avg_score_pct__value'])}</Table.Cell>
                <Table.Cell class="text-right tabular-nums">
                  {$t('insights.of_total', { count: coursesCompleted, total: coursesTotal })}
                </Table.Cell>
              {/if}
              <Table.Cell class="text-right tabular-nums">{formatPercent(row['video_pct__value'])}</Table.Cell>
              <Table.Cell class="text-right tabular-nums">{formatPercent(row['attendance_pct__value'])}</Table.Cell>
              <Table.Cell class="ui:text-muted-foreground text-xs whitespace-nowrap">
                {lastLoginAt ? formatLastSeen(lastLoginAt) : $t('insights.never')}
              </Table.Cell>
              <Table.Cell>
                <div class="flex flex-wrap items-center gap-1">
                  {#if isInsightsStatus(status)}
                    <StatusBadge {status} />
                  {/if}
                  {#if row['is_overdue__value'] === true}
                    <Badge variant="destructive">{$t('insights.flags.overdue')}</Badge>
                  {/if}
                </div>
              </Table.Cell>
            </Table.Row>
          {/each}
        </Table.Body>
      </Table.Root>
    </div>

    <div class="flex flex-col items-center justify-between gap-2 sm:flex-row">
      <p class="ui:text-muted-foreground text-xs">
        {$t('insights.learners.showing', { shown: insightsLearnersApi.rows.length, total: insightsLearnersApi.total })}
      </p>
      {#if insightsLearnersApi.hasMore}
        <Button
          type="button"
          variant="outline"
          size="sm"
          loading={insightsLearnersApi.loadingMore}
          disabled={insightsLearnersApi.loadingMore}
          onclick={() => insightsLearnersApi.loadMore()}
        >
          {$t('insights.learners.show_more')}
        </Button>
      {/if}
    </div>
  {/if}
</div>
