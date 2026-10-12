<script lang="ts">
  import * as Sheet from '@cio/ui/base/sheet';
  import * as Table from '@cio/ui/base/table';
  import { Badge, type BadgeVariant } from '@cio/ui/base/badge';
  import { Button } from '@cio/ui/base/button';
  import { Empty } from '@cio/ui/custom/empty';
  import { Skeleton } from '@cio/ui/base/skeleton';
  import ClipboardListIcon from '@lucide/svelte/icons/clipboard-list';

  import { t } from '$lib/utils/functions/translations';
  import { currentOrg } from '$lib/utils/store/org';
  import { activityApi } from '$features/course/api/activity.svelte';
  import { formatDuration, formatScorePercent } from '$features/course/utils/scorm-utils';
  import type { ActivityLearnerAttempts } from '$features/course/utils/types';

  const T = 'course.navItem.lessons.activities.results.sheet';

  type Attempt = NonNullable<ActivityLearnerAttempts>['attempts'][number];

  function attemptEvents(attempt: Attempt) {
    return attempt.modules.flatMap((module) =>
      module.events.map((event) => ({ ...event, moduleTitle: module.title || module.identifier }))
    );
  }

  function eventDetailText(detail: Record<string, unknown>) {
    const keys = Object.keys(detail);

    if (keys.length === 0) return '';

    try {
      return JSON.stringify(detail);
    } catch {
      return '';
    }
  }

  function eventTimeText(createdAt: string) {
    const parsed = new Date(createdAt);

    if (Number.isNaN(parsed.getTime())) return createdAt;

    return parsed.toLocaleString();
  }

  const COMPLETION_BADGE_VARIANTS: Record<string, BadgeVariant> = {
    completed: 'success',
    incomplete: 'secondary',
    not_attempted: 'outline',
    unknown: 'outline'
  };

  const SUCCESS_BADGE_VARIANTS: Record<string, BadgeVariant> = {
    passed: 'success',
    failed: 'destructive',
    unknown: 'outline'
  };

  let {
    courseId,
    activityId,
    profileId,
    learnerName,
    open = $bindable(false),
    onReset = () => {}
  }: {
    courseId: string;
    activityId: string;
    profileId: string | null;
    learnerName?: string | null;
    open?: boolean;
    onReset?: () => void | Promise<void>;
  } = $props();

  let loadedKey = $state('');
  let confirmingReset = $state(false);

  const detail = $derived(activityApi.learnerAttempts);
  const attempts = $derived<Attempt[]>(detail?.attempts ?? []);

  $effect(() => {
    const organizationId = $currentOrg.id;
    if (!open || !organizationId || !courseId || !activityId || !profileId) return;

    const key = [courseId, activityId, profileId, organizationId].join('|');
    if (key === loadedKey) return;

    loadedKey = key;
    confirmingReset = false;
    void activityApi.getLearnerAttempts(courseId, activityId, profileId);
  });

  function handleOpenChange(next: boolean) {
    open = next;

    if (!next) {
      confirmingReset = false;
    }
  }

  async function handleReset() {
    if (!profileId) return;

    if (!confirmingReset) {
      confirmingReset = true;
      return;
    }

    await activityApi.resetLearner(courseId, activityId, profileId);

    if (activityApi.success) {
      open = false;
      await onReset();
    }
  }
</script>

<Sheet.Root {open} onOpenChange={handleOpenChange}>
  <Sheet.Content class="w-full sm:max-w-3xl">
    <Sheet.Header>
      <Sheet.Title>{$t(`${T}.title`, { learnerName: learnerName ?? '' })}</Sheet.Title>
      <Sheet.Description>{$t(`${T}.description`)}</Sheet.Description>
    </Sheet.Header>

    <div class="flex min-h-0 flex-1 flex-col gap-4 overflow-auto px-4 pb-4">
      {#if !detail}
        {#each [0, 1] as index (index)}
          <div class="ui:border-border rounded-md border p-4">
            <Skeleton class="h-5 w-40" />
            <Skeleton class="mt-2 h-4 w-full" />
            <Skeleton class="mt-2 h-4 w-2/3" />
          </div>
        {/each}
      {:else if attempts.length === 0}
        <Empty
          title={$t(`${T}.no_attempts_title`)}
          description={$t(`${T}.no_attempts_description`)}
          icon={ClipboardListIcon}
        />
      {:else}
        {#each attempts as attempt (attempt.attemptNumber)}
          <div class="ui:border-border rounded-md border">
            <div class="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
              <div class="flex items-center gap-2">
                <span class="text-sm font-semibold">{$t(`${T}.attempt`, { number: attempt.attemptNumber })}</span>
                {#if attempt.packageVersionNumber !== null}
                  <span class="ui:text-muted-foreground text-xs"
                    >{$t(`${T}.version`, { number: attempt.packageVersionNumber })}</span
                  >
                {/if}
                {#if attempt.ruleMet}
                  <Badge variant="success">{$t(`${T}.rule_met`)}</Badge>
                {/if}
              </div>
              <span class="ui:tabular-nums ui:text-muted-foreground text-xs">
                {formatScorePercent(attempt.scorePercent)}
              </span>
            </div>

            <div class="overflow-x-auto">
              <Table.Root>
                <Table.Header>
                  <Table.Row>
                    <Table.Head>{$t(`${T}.columns.module`)}</Table.Head>
                    <Table.Head>{$t(`${T}.columns.completion`)}</Table.Head>
                    <Table.Head>{$t(`${T}.columns.success`)}</Table.Head>
                    <Table.Head>{$t(`${T}.columns.score`)}</Table.Head>
                    <Table.Head>{$t(`${T}.columns.time`)}</Table.Head>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {#each attempt.modules as module (module.unitId)}
                    <Table.Row>
                      <Table.Cell>
                        <div class="font-medium">{module.title || module.identifier}</div>
                        {#if module.location}
                          <div class="ui:text-muted-foreground text-xs">{module.location}</div>
                        {/if}
                        {#if module.interactions.length > 0}
                          <div class="ui:text-muted-foreground mt-1 text-xs">
                            {$t(`${T}.interactions`, { count: module.interactions.length })}
                          </div>
                          <ul class="ui:text-muted-foreground mt-1 space-y-0.5 text-xs">
                            {#each module.interactions as interaction (interaction.index)}
                              <li>
                                {interaction.id ?? `#${interaction.index + 1}`}
                                {#if interaction.type}· {interaction.type}{/if}
                                {#if interaction.studentResponse}· {interaction.studentResponse}{/if}
                                {#if interaction.result}· {interaction.result}{/if}
                              </li>
                            {/each}
                          </ul>
                        {/if}
                      </Table.Cell>
                      <Table.Cell>
                        <Badge variant={COMPLETION_BADGE_VARIANTS[module.completion] ?? 'outline'}>
                          {module.completion}
                        </Badge>
                      </Table.Cell>
                      <Table.Cell>
                        <Badge variant={SUCCESS_BADGE_VARIANTS[module.success] ?? 'outline'}>{module.success}</Badge>
                      </Table.Cell>
                      <Table.Cell class="ui:tabular-nums">{formatScorePercent(module.scaledScorePercent)}</Table.Cell>
                      <Table.Cell class="ui:tabular-nums">{formatDuration(module.timeSpentSeconds)}</Table.Cell>
                    </Table.Row>
                  {/each}
                </Table.Body>
              </Table.Root>
            </div>

            {#if attemptEvents(attempt).length > 0}
              <div class="ui:border-border border-t px-4 py-3">
                <div class="text-xs font-semibold">{$t(`${T}.diagnostics_title`)}</div>
                <ul class="mt-1 space-y-1">
                  {#each attemptEvents(attempt) as event, eventIndex (eventIndex)}
                    <li class="ui:text-muted-foreground text-xs">
                      <span class="font-medium">{event.moduleTitle}</span>
                      {' · '}
                      {$t(`${T}.events.${event.kind}`)}
                      {' · '}
                      <span class="ui:tabular-nums">{eventTimeText(event.createdAt)}</span>
                      {#if eventDetailText(event.detail)}
                        <div class="mt-0.5 font-mono break-all">{eventDetailText(event.detail)}</div>
                      {/if}
                    </li>
                  {/each}
                </ul>
              </div>
            {/if}
          </div>
        {/each}
      {/if}

      {#if profileId}
        <div class="flex justify-end">
          <Button
            variant={confirmingReset ? 'destructive' : 'outline'}
            size="sm"
            onclick={handleReset}
            loading={activityApi.isLoading}
            disabled={activityApi.isLoading}
          >
            {$t(confirmingReset ? `${T}.confirm_reset` : `${T}.reset`)}
          </Button>
        </div>
      {/if}
    </div>
  </Sheet.Content>
</Sheet.Root>
