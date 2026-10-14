<script lang="ts">
  import * as Card from '@cio/ui/base/card';
  import * as Table from '@cio/ui/base/table';
  import { Badge, type BadgeVariant } from '@cio/ui/base/badge';
  import { Empty } from '@cio/ui/custom/empty';
  import { Skeleton } from '@cio/ui/base/skeleton';
  import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
  import ChevronUpIcon from '@lucide/svelte/icons/chevron-up';
  import PackageIcon from '@lucide/svelte/icons/package';

  import { t } from '$lib/utils/functions/translations';
  import { currentOrg } from '$lib/utils/store/org';
  import { activityApi } from '$features/course/api/activity.svelte';
  import { ExportMenu, TablePagination } from '$features/ui';
  import { formatDuration, formatScorePercent, unitPassMark } from '$features/course/utils/scorm-utils';
  import type { ActivityResultsLearner } from '$features/course/utils/types';
  import type { TScormResultsQuery } from '@cio/utils/validation/activity/report';
  import type { ExportDocument } from '@cio/utils/export';

  const T = 'course.navItem.lessons.activities.results';

  type SortKey = TScormResultsQuery['sort'];

  const STATUS_BADGE_VARIANTS: Record<ActivityResultsLearner['status'], BadgeVariant> = {
    completed: 'success',
    failed: 'warning',
    in_progress: 'secondary',
    not_started: 'outline'
  };

  const SORT_COLUMNS: Array<{ key: SortKey; labelKey: string }> = [
    { key: 'name', labelKey: `${T}.table.student` },
    { key: 'score', labelKey: `${T}.table.score` },
    { key: 'status', labelKey: `${T}.table.status` },
    { key: 'attempts', labelKey: `${T}.table.attempts` },
    { key: 'last_launched', labelKey: `${T}.table.last_launched` }
  ];

  let {
    courseId,
    activityId,
    onSelectLearner = () => {}
  }: {
    courseId: string;
    activityId: string;
    onSelectLearner?: (profileId: string) => void;
  } = $props();

  let sort = $state<SortKey>('last_launched');
  let direction = $state<'asc' | 'desc'>('desc');
  let page = $state(1);
  const limit = 20;
  let loadedKey = $state('');

  const summary = $derived(activityApi.resultsSummary);
  const learners = $derived(activityApi.results ?? []);
  const pagination = $derived(activityApi.resultsPagination);

  const graded = $derived.by(() => {
    if ((summary?.averageScore ?? null) !== null) return true;

    const editor = activityApi.editor;
    if (!editor || !editor.available || !editor.package) return false;

    return editor.package.units.some((unit) => unitPassMark(unit) !== null);
  });

  const summaryCards = $derived.by(() => {
    if (!summary) return [];

    const enrolled = summary.enrolled;
    const inProgress = summary.started - summary.completed;
    const notStarted = enrolled - summary.started;
    const share = (count: number) => (enrolled > 0 ? ` · ${Math.round((count / enrolled) * 100)}%` : '');
    const cards = [
      { labelKey: `${T}.summary.enrolled`, value: String(enrolled) },
      { labelKey: `${T}.summary.in_progress`, value: `${inProgress}${share(inProgress)}` },
      { labelKey: `${T}.summary.completed`, value: `${summary.completed}${share(summary.completed)}` }
    ];

    if (graded) {
      cards.push({ labelKey: `${T}.summary.average_score`, value: formatScorePercent(summary.averageScore) });
    } else {
      cards.push({ labelKey: `${T}.summary.not_started`, value: `${notStarted}${share(notStarted)}` });
    }

    return cards;
  });

  $effect(() => {
    const organizationId = $currentOrg.id;
    if (!organizationId || !courseId || !activityId) return;

    const key = [courseId, activityId, sort, direction, page, organizationId].join('|');
    if (key === loadedKey) return;

    loadedKey = key;
    void activityApi.listResults(courseId, activityId, { page, limit, sort, direction });
  });

  function changeSort(key: SortKey) {
    if (sort === key) {
      direction = direction === 'asc' ? 'desc' : 'asc';
    } else {
      sort = key;
      direction = key === 'name' ? 'asc' : 'desc';
    }
    page = 1;
  }

  function formatLaunched(value: string | null) {
    if (!value) return '—';

    return new Date(value).toLocaleString();
  }

  async function exportDocument(): Promise<ExportDocument<ActivityResultsLearner>> {
    const total = pagination?.total ?? learners.length;
    const rows: ActivityResultsLearner[] = [];
    const pages = Math.max(1, Math.ceil(total / 100));

    for (let exportPage = 1; exportPage <= pages; exportPage += 1) {
      await activityApi.listResults(courseId, activityId, { page: exportPage, limit: 100, sort, direction });
      rows.push(...(activityApi.results ?? []));

      if ((activityApi.results ?? []).length < 100) break;
    }

    await activityApi.listResults(courseId, activityId, { page, limit, sort, direction });

    return {
      filename: 'scorm-results',
      title: t.get(`${T}.export.title`),
      columns: [
        {
          key: 'student',
          header: t.get(`${T}.table.student`),
          value: (row) => row.fullname ?? row.email ?? row.profileId
        },
        { key: 'status', header: t.get(`${T}.table.status`), value: (row) => t.get(`${T}.status.${row.status}`) },
        {
          key: 'passFail',
          header: t.get(`${T}.table.pass_fail`),
          value: (row) => (row.passFail ? t.get(`${T}.pass_fail.${row.passFail}`) : '—')
        },
        { key: 'score', header: t.get(`${T}.table.score`), value: (row) => row.scorePercent ?? '—' },
        { key: 'bestScore', header: t.get(`${T}.table.best_score`), value: (row) => row.bestScorePercent ?? '—' },
        {
          key: 'timeSpent',
          header: t.get(`${T}.table.time_spent`),
          value: (row) => formatDuration(row.timeSpentSeconds)
        },
        { key: 'attempts', header: t.get(`${T}.table.attempts`), value: (row) => row.attempts },
        {
          key: 'lastLaunched',
          header: t.get(`${T}.table.last_launched`),
          value: (row) => formatLaunched(row.lastLaunchedAt)
        }
      ],
      rows
    };
  }
</script>

<div class="flex flex-col gap-4">
  {#if !summary}
    <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {#each [0, 1, 2, 3] as index (index)}
        <Card.Root class="ui:py-3">
          <Card.Content class="flex flex-col gap-1">
            <Skeleton class="h-6 w-12" />
            <Skeleton class="h-4 w-20" />
          </Card.Content>
        </Card.Root>
      {/each}
    </div>
  {:else}
    <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {#each summaryCards as card (card.labelKey)}
        <Card.Root class="ui:py-3">
          <Card.Content class="flex flex-col gap-1">
            <span class="ui:tabular-nums text-xl font-semibold">{card.value}</span>
            <span class="ui:text-muted-foreground text-xs">{$t(card.labelKey)}</span>
          </Card.Content>
        </Card.Root>
      {/each}
    </div>
  {/if}

  <div class="flex items-center justify-end">
    <ExportMenu document={exportDocument} testId="activity-results-export" disabled={learners.length === 0} />
  </div>

  <Card.Root class="ui:gap-0 ui:overflow-hidden ui:py-0">
    <div class="overflow-x-auto">
      <Table.Root data-testid="activity-results-table">
        <Table.Header>
          <Table.Row>
            {#each SORT_COLUMNS as column (column.key)}
              <Table.Head>
                <button
                  type="button"
                  class="flex items-center gap-1 text-xs font-medium hover:underline"
                  onclick={() => changeSort(column.key)}
                >
                  {$t(column.labelKey)}
                  {#if sort === column.key}
                    {#if direction === 'asc'}
                      <ChevronUpIcon class="size-3" />
                    {:else}
                      <ChevronDownIcon class="size-3" />
                    {/if}
                  {/if}
                </button>
              </Table.Head>
            {/each}
            <Table.Head>{$t(`${T}.table.best_score`)}</Table.Head>
            <Table.Head>{$t(`${T}.table.time_spent`)}</Table.Head>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {#if !summary}
            {#each [0, 1, 2] as index (index)}
              <Table.Row>
                {#each [0, 1, 2, 3, 4, 5, 6] as cell (cell)}
                  <Table.Cell><Skeleton class="h-4 w-full" /></Table.Cell>
                {/each}
              </Table.Row>
            {/each}
          {:else if learners.length === 0}
            <Table.Row>
              <Table.Cell colspan={7} class="py-8 text-center">
                <Empty
                  title={$t('course.navItem.lessons.activities.results_placeholder_title')}
                  description={$t('course.navItem.lessons.activities.results_placeholder_description')}
                  icon={PackageIcon}
                />
              </Table.Cell>
            </Table.Row>
          {:else}
            {#each learners as learner (learner.profileId)}
              <Table.Row>
                <Table.Cell>
                  <button
                    type="button"
                    class="text-left font-medium hover:underline"
                    onclick={() => onSelectLearner(learner.profileId)}
                  >
                    {learner.fullname ?? learner.email ?? learner.profileId}
                  </button>
                  {#if learner.fullname && learner.email}
                    <div class="ui:text-muted-foreground text-xs">{learner.email}</div>
                  {/if}
                </Table.Cell>
                <Table.Cell class="ui:tabular-nums">{formatScorePercent(learner.scorePercent)}</Table.Cell>
                <Table.Cell>
                  <Badge variant={STATUS_BADGE_VARIANTS[learner.status]}>{$t(`${T}.status.${learner.status}`)}</Badge>
                  {#if learner.passFail}
                    <span class="ui:text-muted-foreground ml-1 text-xs">{$t(`${T}.pass_fail.${learner.passFail}`)}</span
                    >
                  {/if}
                </Table.Cell>
                <Table.Cell class="ui:tabular-nums">{learner.attempts}</Table.Cell>
                <Table.Cell class="ui:tabular-nums ui:text-muted-foreground text-xs">
                  {formatLaunched(learner.lastLaunchedAt)}
                </Table.Cell>
                <Table.Cell class="ui:tabular-nums">{formatScorePercent(learner.bestScorePercent)}</Table.Cell>
                <Table.Cell class="ui:tabular-nums">{formatDuration(learner.timeSpentSeconds)}</Table.Cell>
              </Table.Row>
            {/each}
          {/if}
        </Table.Body>
      </Table.Root>
    </div>
  </Card.Root>

  {#if pagination && pagination.totalPages > 1}
    <TablePagination
      count={pagination.total}
      perPage={pagination.limit}
      page={pagination.page}
      onPageChange={(next) => (page = next)}
    />
  {/if}
</div>
