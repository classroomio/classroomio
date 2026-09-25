<script lang="ts">
  import type { Component } from 'svelte';
  import dayjs from 'dayjs';
  import { Badge } from '@cio/ui/base/badge';
  import { buttonVariants } from '@cio/ui/base/button';
  import { Card } from '@cio/ui/base/card';
  import AlertCircleIcon from '@lucide/svelte/icons/alert-circle';
  import CheckIcon from '@lucide/svelte/icons/check';
  import ClockIcon from '@lucide/svelte/icons/clock';
  import InboxIcon from '@lucide/svelte/icons/inbox';
  import LockIcon from '@lucide/svelte/icons/lock';
  import { profile } from '$lib/utils/store/user';
  import { currentOrg } from '$lib/utils/store/org';
  import { snackbar } from '$features/ui/snackbar/store';
  import { lmsExercisesApi } from '$features/lms/api/exercises.svelte';
  import { t } from '$lib/utils/functions/translations';

  const STATUS = {
    NOT_SUBMITTED: 0,
    SUBMITTED: 1,
    IN_PROGRESS: 2,
    GRADED: 3
  } as const;

  let hasFetched = $state(false);

  interface ExerciseRow {
    exerciseId: string;
    title: string;
    courseTitle: string;
    url: string;
    statusId: number;
    isOverdue: boolean;
    dueDate: string;
    submissionKey: string;
    grade: string;
    gradeDim: boolean;
    actionKey: string;
    actionVariant: 'default' | 'outline';
    statusBadge: { labelKey: string; icon: Component; className: string };
  }

  interface SummaryCard {
    key: string;
    labelKey: string;
    value: number;
    icon: Component | null;
    iconClass: string;
  }

  const SOFT_SUCCESS =
    'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-900 border-transparent';
  const SOFT_INFO =
    'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:ring-blue-900 border-transparent';
  const SOFT_DESTRUCTIVE =
    'bg-red-50 text-red-700 ring-1 ring-inset ring-red-200 dark:bg-red-950/40 dark:text-red-300 dark:ring-red-900 border-transparent';

  function buildBadge(statusId: number, isOverdue: boolean) {
    if (isOverdue) return { labelKey: 'exercises.overdue', icon: AlertCircleIcon, className: SOFT_DESTRUCTIVE };

    switch (statusId) {
      case STATUS.GRADED:
        return { labelKey: 'exercises.graded', icon: CheckIcon, className: SOFT_SUCCESS };
      case STATUS.IN_PROGRESS:
        return { labelKey: 'exercises.in_progress', icon: ClockIcon, className: SOFT_INFO };
      case STATUS.SUBMITTED:
        return {
          labelKey: 'exercises.submitted',
          icon: InboxIcon,
          className: 'ui:text-secondary-foreground ui:bg-secondary border-transparent'
        };
      default:
        return {
          labelKey: 'exercises.not_submitted',
          icon: LockIcon,
          className: 'ui:text-muted-foreground ui:bg-muted border-transparent'
        };
    }
  }

  function buildAction(statusId: number, isOverdue: boolean): { key: string; variant: 'default' | 'outline' } {
    if (isOverdue || statusId === STATUS.IN_PROGRESS) return { key: 'exercises.actions.continue', variant: 'default' };
    if (statusId === STATUS.NOT_SUBMITTED) return { key: 'exercises.actions.start', variant: 'outline' };
    return { key: 'exercises.actions.view', variant: 'outline' };
  }

  function submissionKey(statusId: number): string {
    if (statusId === STATUS.GRADED) return 'exercises.submission_states.submitted';
    if (statusId === STATUS.SUBMITTED) return 'exercises.submission_states.awaiting_grade';
    return 'exercises.submission_states.not_submitted';
  }

  const rows = $derived<ExerciseRow[]>(
    lmsExercisesApi.exercises.map((exercise) => {
      const submissionItem = exercise.submission[0] || { status_id: 0, total: 0 };

      const statusId = submissionItem.status_id;
      const dueDate = exercise.due_by ? dayjs(exercise.due_by) : null;
      const isOverdue = statusId === STATUS.NOT_SUBMITTED && !!dueDate && dueDate.isBefore(dayjs());

      const totalPoints = exercise.questions.reduce((sum, question) => sum + (question.points || 0), 0);
      const gradePct =
        statusId === STATUS.GRADED && totalPoints > 0
          ? `${Math.round(((submissionItem.total || 0) / totalPoints) * 100)}%`
          : null;

      const courseURL = `/courses/${exercise.lesson.course.id}`;
      const exerciseURL = `${courseURL}/exercises/${exercise.id}`;
      const action = buildAction(statusId, isOverdue);

      return {
        exerciseId: exercise.id,
        title: exercise.title,
        courseTitle: exercise.lesson.course.title,
        url: exerciseURL,
        statusId,
        isOverdue,
        dueDate: dueDate ? dueDate.format('MMM D, YYYY') : '—',
        submissionKey: submissionKey(statusId),
        grade: gradePct || '—',
        gradeDim: !gradePct,
        actionKey: action.key,
        actionVariant: action.variant,
        statusBadge: buildBadge(statusId, isOverdue)
      };
    })
  );

  const summary = $derived<SummaryCard[]>([
    { key: 'total', labelKey: 'exercises.total', value: rows.length, icon: null, iconClass: '' },
    {
      key: 'completed',
      labelKey: 'exercises.completed',
      value: rows.filter((row) => row.statusId === STATUS.GRADED).length,
      icon: CheckIcon,
      iconClass: 'text-emerald-600 dark:text-emerald-400'
    },
    {
      key: 'in_progress',
      labelKey: 'exercises.in_progress',
      value: rows.filter((row) => row.statusId === STATUS.IN_PROGRESS).length,
      icon: ClockIcon,
      iconClass: 'text-blue-500 dark:text-blue-400'
    },
    {
      key: 'submitted',
      labelKey: 'exercises.submitted',
      value: rows.filter((row) => row.statusId === STATUS.SUBMITTED).length,
      icon: InboxIcon,
      iconClass: 'ui:text-muted-foreground'
    },
    {
      key: 'not_submitted',
      labelKey: 'exercises.not_submitted',
      value: rows.filter((row) => row.statusId === STATUS.NOT_SUBMITTED).length,
      icon: AlertCircleIcon,
      iconClass: 'text-amber-500 dark:text-amber-400'
    }
  ]);

  const gridCols = 'lg:grid-cols-[2.4fr_1.4fr_1fr_1fr_1fr_0.8fr_0.7fr]';

  async function fetchData(profileId?: string, orgId?: string) {
    if (hasFetched || !profileId || !orgId) {
      return;
    }

    hasFetched = true;

    await lmsExercisesApi.fetchLMSExercises(orgId);

    if (!lmsExercisesApi.success) {
      snackbar.error('snackbar.exercise.error_fetching');
      return;
    }
  }

  $effect(() => {
    fetchData($profile.id, $currentOrg.id);
  });
</script>

<div class="space-y-7">
  <div class="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-5">
    {#each summary as card (card.key)}
      <Card class="ui:gap-1 ui:px-4 ui:py-3.5">
        <p class="ui:text-muted-foreground flex items-center gap-1.5 text-xs font-medium">
          {#if card.icon}
            <svelte:component this={card.icon} size={13} class={card.iconClass} />
          {/if}
          {$t(card.labelKey)}
        </p>
        <p class="text-[22px] font-semibold tracking-tight tabular-nums">{card.value}</p>
      </Card>
    {/each}
  </div>

  <Card class="ui:gap-0 ui:p-0 ui:overflow-hidden">
    <div
      class="ui:text-muted-foreground ui:border-border hidden border-b px-4 py-3 text-[11.5px] font-semibold tracking-wide uppercase lg:grid {gridCols} lg:items-center lg:gap-3"
    >
      <span>{$t('exercises.table.assignment')}</span>
      <span>{$t('exercises.table.course')}</span>
      <span>{$t('exercises.table.status')}</span>
      <span>{$t('exercises.table.due_date')}</span>
      <span>{$t('exercises.table.submission')}</span>
      <span>{$t('exercises.table.grade')}</span>
      <span></span>
    </div>

    {#if rows.length}
      {#each rows as row (row.exerciseId)}
        <a
          href={row.url}
          class="{gridCols} ui:border-border hover:ui:bg-accent/45 last-of-type:ui:border-b-0 grid grid-cols-1 gap-2 border-b px-4 py-3.5 text-[13.5px] transition-colors lg:items-center lg:gap-3"
        >
          <div>
            <p class="ui:text-muted-foreground mb-0.5 text-[10.5px] tracking-wide uppercase lg:hidden">
              {$t('exercises.table.assignment')}
            </p>
            <p class="font-medium">{row.title}</p>
          </div>

          <div>
            <p class="ui:text-muted-foreground mb-0.5 text-[10.5px] tracking-wide uppercase lg:hidden">
              {$t('exercises.table.course')}
            </p>
            <p class="ui:text-muted-foreground">{row.courseTitle}</p>
          </div>

          <div>
            <p class="ui:text-muted-foreground mb-0.5 text-[10.5px] tracking-wide uppercase lg:hidden">
              {$t('exercises.table.status')}
            </p>
            <Badge variant="outline" class="ui:px-2 ui:py-0.5 ui:text-xs {row.statusBadge.className}">
              <svelte:component this={row.statusBadge.icon} size={12} />
              {$t(row.statusBadge.labelKey)}
            </Badge>
          </div>

          <div>
            <p class="ui:text-muted-foreground mb-0.5 text-[10.5px] tracking-wide uppercase lg:hidden">
              {$t('exercises.table.due_date')}
            </p>
            <p class="ui:text-muted-foreground tabular-nums {row.isOverdue ? 'text-red-600 dark:text-red-400' : ''}">
              {row.dueDate}
            </p>
          </div>

          <div>
            <p class="ui:text-muted-foreground mb-0.5 text-[10.5px] tracking-wide uppercase lg:hidden">
              {$t('exercises.table.submission')}
            </p>
            <p class="ui:text-muted-foreground">{$t(row.submissionKey)}</p>
          </div>

          <div>
            <p class="ui:text-muted-foreground mb-0.5 text-[10.5px] tracking-wide uppercase lg:hidden">
              {$t('exercises.table.grade')}
            </p>
            <p class="font-semibold tabular-nums {row.gradeDim ? 'ui:text-muted-foreground ui:font-normal' : ''}">
              {row.grade}
            </p>
          </div>

          <div>
            <span class={buttonVariants({ variant: row.actionVariant, size: 'sm' })}>
              {$t(row.actionKey)}
            </span>
          </div>
        </a>
      {/each}
    {:else}
      <p class="ui:text-muted-foreground px-4 py-10 text-center text-sm">{$t('exercises.empty')}</p>
    {/if}
  </Card>
</div>
