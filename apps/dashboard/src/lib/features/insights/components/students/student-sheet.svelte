<script lang="ts">
  import { resolve } from '$app/paths';
  import { page } from '$app/state';
  import * as Sheet from '@cio/ui/base/sheet';
  import { Skeleton } from '@cio/ui/base/skeleton';
  import { Button } from '@cio/ui/base/button';
  import { Empty } from '@cio/ui/custom/empty';
  import ChevronLeftIcon from '@lucide/svelte/icons/chevron-left';
  import CircleAlertIcon from '@lucide/svelte/icons/circle-alert';
  import { formatLastSeen } from '$features/audience/utils/audience-utils';
  import { t } from '$lib/utils/functions/translations';

  import { insightsApi, insightsStudentSheetApi } from '../../api';
  import {
    canReturnToAllCourses,
    CHIP_CLASS,
    formatPercent,
    isInsightsStatus,
    latestScore,
    nowAtLabel,
    numberCell,
    scopeCourse,
    textCell
  } from '../../utils/insights-utils';
  import InsightsPill from '../insights-pill.svelte';
  import StatusBadge from '../status-badge.svelte';
  import StudentCoursesTable from './student-courses-table.svelte';
  import StudentScoresChart from './student-scores-chart.svelte';

  const sheet = insightsStudentSheetApi;

  const row = $derived(sheet.student?.row);
  const status = $derived(row?.['status__value']);
  const lastLoginAt = $derived(textCell(row, 'last_login_at__value'));
  const course = $derived(scopeCourse(insightsApi.dashboard, sheet.courseId));
  const showBackToAllCourses = $derived(canReturnToAllCourses(insightsApi.selection.courseId, sheet.courseId));
  const courseProgress = $derived(numberCell(sheet.courseRow ?? undefined, 'progress_pct__value'));
  const courseNowAt = $derived(
    nowAtLabel(courseProgress, textCell(sheet.courseRow ?? undefined, 'now_at_title__value'), $t)
  );
  const latest = $derived(sheet.scores ? latestScore(sheet.scores) : null);
  const coursesCompleted = $derived(numberCell(row, 'courses_completed__value') ?? 0);
  const coursesTotal = $derived(numberCell(row, 'courses_total__value') ?? 0);
  const certificates = $derived(numberCell(row, 'certificates__value') ?? 0);
  const profileHref = $derived(
    course && sheet.student
      ? resolve(`/courses/${course.id}/people/${sheet.student.id}?back=${page.url.pathname}`, {})
      : ''
  );

  function handleOpenChange(isOpen: boolean) {
    if (!isOpen) sheet.close();
  }

  function handleSelectCourse(courseId: string | null) {
    void sheet.selectCourse(courseId);
  }
</script>

<Sheet.Root open={sheet.isOpen} onOpenChange={handleOpenChange}>
  <Sheet.Content class="w-full sm:max-w-3xl" data-testid="insights-student-sheet">
    <Sheet.Header>
      <Sheet.Title>{sheet.student?.name ?? ''}</Sheet.Title>
      <Sheet.Description>{textCell(row, 'email__value') ?? ''}</Sheet.Description>
      <div class="flex flex-wrap items-center gap-2 text-xs">
        {#if isInsightsStatus(status)}
          <StatusBadge {status} />
        {/if}
        {#if row?.['is_overdue__value'] === true}
          <InsightsPill tone="risk">{$t('insights.flags.overdue')}</InsightsPill>
        {/if}
        <span class="ui:text-muted-foreground">
          {$t('insights.student_sheet.last_login', {
            when: lastLoginAt ? formatLastSeen(lastLoginAt) : $t('insights.never')
          })}
        </span>
      </div>
    </Sheet.Header>

    <div class="flex min-h-0 flex-1 flex-col gap-4 overflow-auto px-4 pb-4">
      {#if course && showBackToAllCourses}
        <Button
          variant="ghost"
          size="sm"
          class="-ml-2 self-start"
          onclick={() => handleSelectCourse(null)}
          testId="insights-student-sheet-back"
        >
          <ChevronLeftIcon />
          {$t('insights.student_sheet.all_courses')}
        </Button>
      {/if}

      <ul class="flex flex-wrap gap-2">
        {#if course}
          <li class={CHIP_CLASS}>
            {$t('insights.student_chips.progress')} <b>{formatPercent(courseProgress)}</b> · {$t(
              'insights.student_chips.now_at',
              { place: courseNowAt }
            )}
          </li>
          <li class={CHIP_CLASS}>{$t('insights.student_chips.latest')} <b>{formatPercent(latest)}</b></li>
        {:else}
          <li class={CHIP_CLASS}>
            {$t('insights.student_chips.progress')} <b>{formatPercent(row?.['overall_progress_pct__value'])}</b>
          </li>
          <li class={CHIP_CLASS}>
            {$t('insights.columns.average_score')} <b>{formatPercent(row?.['avg_score_pct__value'])}</b>
          </li>
          <li class={CHIP_CLASS}>
            {$t('insights.columns.courses_completed')}
            <b>{$t('insights.of_total', { count: coursesCompleted, total: coursesTotal })}</b>
          </li>
          <li class={CHIP_CLASS}>
            {$t('insights.columns.certificate')}
            <b>{certificates > 0 ? $t('insights.certificate_issued', { count: certificates }) : '–'}</b>
          </li>
        {/if}
      </ul>

      <section class="flex flex-col gap-3">
        <h3 class="text-sm font-semibold">
          {course
            ? $t('insights.student_sheet.scores_heading', { course: course.title })
            : $t('insights.student_sheet.courses_heading')}
        </h3>
        {#if sheet.failed}
          <Empty icon={CircleAlertIcon} title={$t('insights.empty.failed')} class="h-[240px]">
            <Button variant="outline" size="sm" onclick={() => sheet.load()}>{$t('insights.retry')}</Button>
          </Empty>
        {:else if course && sheet.scores}
          <StudentScoresChart
            result={sheet.scores}
            courseRow={sheet.courseRow}
            studentName={sheet.student?.name ?? ''}
          />
          <Button variant="outline" size="sm" class="self-start" href={profileHref}>
            {$t('insights.student_sheet.open_profile')}
          </Button>
        {:else if !course && sheet.courses}
          <StudentCoursesTable result={sheet.courses} onSelectCourse={handleSelectCourse} />
          <p class="ui:text-muted-foreground text-xs">{$t('insights.notes.student_sheet_pick_course')}</p>
        {:else}
          <Skeleton class="h-[260px] w-full" />
        {/if}
      </section>
    </div>
  </Sheet.Content>
</Sheet.Root>
