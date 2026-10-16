<script lang="ts">
  import * as Collapsible from '@cio/ui/base/collapsible';
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
  import { describeUserAgent, formatDuration, formatScorePercent } from '$features/course/utils/scorm-utils';
  import type { ActivityLearnerAttempts } from '$features/course/utils/types';

  const T = 'course.navItem.lessons.activities.results.sheet';

  type Attempt = NonNullable<ActivityLearnerAttempts>['attempts'][number];
  type TimelineEvent = Attempt['modules'][number]['events'][number] & { moduleTitle: string };

  function attemptTimeline(attempt: Attempt): TimelineEvent[] {
    return attempt.modules
      .flatMap((module) => module.events.map((event) => ({ ...event, moduleTitle: module.title || module.identifier })))
      .sort((left, right) => left.createdAt.localeCompare(right.createdAt));
  }

  function attemptDevice(timeline: TimelineEvent[]): string | null {
    for (const event of timeline) {
      const device = describeUserAgent(event.userAgent);
      if (device) return device;
    }

    return null;
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
    failed: 'warning',
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

    confirmingReset = false;

    const key = [courseId, activityId, profileId, organizationId].join('|');
    if (key === loadedKey) return;

    loadedKey = key;
    void activityApi.getLearnerAttempts(courseId, activityId, profileId);
  });

  function handleOpenChange(next: boolean) {
    open = next;
    confirmingReset = false;

    if (!next) {
      loadedKey = '';
      activityApi.learnerAttempts = null;
    }
  }

  async function handleReset() {
    if (!profileId) return;

    if (!confirmingReset) {
      confirmingReset = true;
      return;
    }

    try {
      await activityApi.resetLearner(courseId, activityId, profileId);

      if (activityApi.success) {
        handleOpenChange(false);
        await onReset();
      } else {
        confirmingReset = false;
      }
    } catch {
      confirmingReset = false;
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
                                {interaction.description ?? interaction.id ?? `#${interaction.index + 1}`}
                                {#if interaction.description && interaction.id && interaction.description !== interaction.id}
                                  ({interaction.id})
                                {/if}
                                {#if interaction.type}· {interaction.type}{/if}
                                {#if interaction.studentResponse}· {interaction.studentResponse}{/if}
                                {#if interaction.correctResponse}· {$t(`${T}.interaction_correct`, {
                                    answer: interaction.correctResponse
                                  })}{/if}
                                {#if interaction.result}· {interaction.result}{/if}
                              </li>
                            {/each}
                          </ul>
                        {/if}
                      </Table.Cell>
                      <Table.Cell>
                        <Badge variant={COMPLETION_BADGE_VARIANTS[module.completion] ?? 'outline'}>
                          {$t(`${T}.module_completion.${module.completion}`, { default: module.completion })}
                        </Badge>
                      </Table.Cell>
                      <Table.Cell>
                        <Badge variant={SUCCESS_BADGE_VARIANTS[module.success] ?? 'outline'}>
                          {$t(`${T}.module_success.${module.success}`, { default: module.success })}
                        </Badge>
                      </Table.Cell>
                      <Table.Cell class="ui:tabular-nums">{formatScorePercent(module.scaledScorePercent)}</Table.Cell>
                      <Table.Cell class="ui:tabular-nums">{formatDuration(module.timeSpentSeconds)}</Table.Cell>
                    </Table.Row>
                  {/each}
                </Table.Body>
              </Table.Root>
            </div>

            {#if attemptTimeline(attempt).length > 0}
              {@const timeline = attemptTimeline(attempt)}
              {@const device = attemptDevice(timeline)}
              <div class="ui:border-border border-t px-4 py-3">
                <div class="text-xs font-semibold">{$t(`${T}.diagnostics_title`)}</div>
                {#if device}
                  <div class="ui:text-muted-foreground mt-0.5 text-xs">
                    {$t(`${T}.session_device`, { device })}
                  </div>
                {/if}
                <ul class="mt-1 space-y-1">
                  {#each timeline as event, eventIndex (eventIndex)}
                    <li class="ui:text-muted-foreground text-xs">
                      <span class="font-medium">{event.moduleTitle}</span>
                      ·
                      {#if event.kind === 'error' && (event.detail as Record<string, unknown>)?.reason === 'stale_sequence'}
                        {$t(`${T}.events.duplicate`)}
                      {:else}
                        {$t(`${T}.events.${event.kind}`)}
                      {/if}
                      ·
                      <span class="ui:tabular-nums">{eventTimeText(event.createdAt)}</span>
                    </li>
                  {/each}
                </ul>
                <Collapsible.Root>
                  <Collapsible.Trigger>
                    {#snippet child({ props })}
                      <Button {...props} variant="link" size="sm" class="mt-1 h-auto p-0 text-xs">
                        {$t(`${T}.technical_details`)}
                      </Button>
                    {/snippet}
                  </Collapsible.Trigger>
                  <Collapsible.Content>
                    <ul class="mt-1 space-y-1">
                      {#each timeline as event, eventIndex (eventIndex)}
                        {#if eventDetailText(event.detail)}
                          <li class="ui:text-muted-foreground font-mono text-xs break-all">
                            {eventTimeText(event.createdAt)} · {event.moduleTitle} ·
                            {eventDetailText(event.detail)}
                          </li>
                        {/if}
                      {/each}
                    </ul>
                  </Collapsible.Content>
                </Collapsible.Root>
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
