<script lang="ts">
  import { onMount } from 'svelte';
  import { Button } from '@cio/ui/base/button';
  import LoaderIcon from '@lucide/svelte/icons/loader';
  import CheckCircleIcon from '@lucide/svelte/icons/check-circle-2';
  import XCircleIcon from '@lucide/svelte/icons/x-circle';
  import AlertTriangleIcon from '@lucide/svelte/icons/alert-triangle';
  import PauseIcon from '@lucide/svelte/icons/pause-circle';

  import ProgressCard from '$features/ai-assistant/progress-card.svelte';
  import { t } from '$lib/utils/functions/translations';
  import type { ProgressStep, ToolLineUi } from '$features/ai-assistant/utils/tool-labels';

  interface RunMonitorState {
    titleKey: string;
    steps: ProgressStep[];
    currentActionLine?: ToolLineUi;
    isStopped: boolean;
    error?: string;
    canCancel: boolean;
    canPause?: boolean;
    canRetry: boolean;
    canResume: boolean;
  }

  /** Queued for longer than this before we bother asking BullMQ what happened. */
  const QUEUED_PROBE_THRESHOLD_MS = 30_000;

  interface Props {
    state: RunMonitorState;
    courseId: string;
    /** Underlying run status; drives the stuck-queued detector. */
    runStatus?: string | null;
    /** When the run started waiting in the queue. Debounces the queue inspection. */
    queuedSince?: string | null;
    onCancel: () => void;
    onPause?: () => void;
    onResume: () => void;
    onRetry: () => void;
    onRetryStuck?: () => void;
    retryStuckLoading?: boolean;
    /** BullMQ's verdict on the queued job, read from the API. */
    queueStalled?: boolean;
    onMentionClick: (route: string) => void;
  }

  let {
    state: runState,
    courseId,
    runStatus = null,
    queuedSince = null,
    onCancel,
    onPause,
    onResume,
    onRetry,
    onRetryStuck,
    retryStuckLoading = false,
    queueStalled = false,
    onMentionClick
  }: Props = $props();

  // `now` ticks every 5s so the elapsed-time check keeps re-evaluating even
  // when the run row itself isn't changing.
  let now = $state(Date.now());
  onMount(() => {
    const id = setInterval(() => (now = Date.now()), 5_000);
    return () => clearInterval(id);
  });

  const isQueuedTooLong = $derived.by(() => {
    if (runStatus !== 'queued' || !queuedSince) return false;
    const queuedAt = Date.parse(queuedSince);
    if (!Number.isFinite(queuedAt)) return false;
    return now - queuedAt > QUEUED_PROBE_THRESHOLD_MS;
  });

  // The titleKey already covers running / completed / failed / canceled — pick
  // a matching icon so the pane state is readable at a glance without parsing
  // the text.
  const StatusIcon = $derived.by(() => {
    if (runState.error || runState.canRetry) return XCircleIcon;
    if (runState.canResume) return PauseIcon;
    if (runState.isStopped) return AlertTriangleIcon;
    if (runState.titleKey === 'ai_assistant.run_completed') return CheckCircleIcon;
    return LoaderIcon;
  });

  const isWorking = $derived(!runState.isStopped && runState.titleKey !== 'ai_assistant.run_completed');
</script>

<div
  class="ui:bg-background flex w-full flex-col gap-3 border-t px-4 py-3"
  role="region"
  aria-label={$t('ai_assistant.run_monitor_aria')}
>
  <div class="ui:text-foreground flex items-center gap-2 text-sm font-medium">
    <StatusIcon size={16} class={isWorking ? 'ui:text-primary animate-spin' : 'ui:text-muted-foreground'} />
    <span>{$t(runState.titleKey)}</span>
  </div>

  <ProgressCard
    titleKey={runState.titleKey}
    steps={runState.steps}
    currentActionLine={runState.currentActionLine}
    {courseId}
    onNavigate={onMentionClick}
    onStop={undefined}
    isStopped={runState.isStopped}
    error={runState.error}
    showTitle={false}
  />

  {#if isQueuedTooLong && queueStalled}
    <div
      class="flex items-start gap-2 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300"
      role="alert"
    >
      <AlertTriangleIcon size={14} class="mt-0.5 shrink-0" />
      <div class="min-w-0 flex-1">
        <p class="font-medium">{$t('ai_assistant.run_monitor.stuck_queued.title')}</p>
        <p class="mt-0.5">{$t('ai_assistant.run_monitor.stuck_queued.body')}</p>
      </div>
      {#if onRetryStuck}
        <Button size="sm" variant="outline" onclick={onRetryStuck} loading={retryStuckLoading} class="shrink-0">
          {$t('ai_assistant.retry')}
        </Button>
      {/if}
    </div>
  {/if}

  <div class="flex gap-2">
    {#if runState.canPause && onPause}
      <Button size="sm" variant="outline" onclick={onPause} class="flex-1">
        {$t('ai_assistant.run_monitor.pause')}
      </Button>
    {/if}
    {#if runState.canCancel}
      <Button size="sm" variant="outline" onclick={onCancel} class="flex-1">
        {$t('ai_assistant.run_monitor.cancel')}
      </Button>
    {/if}
    {#if runState.canRetry}
      <Button size="sm" variant="outline" onclick={onRetry} class="flex-1">
        {$t('ai_assistant.retry')}
      </Button>
    {/if}
    {#if runState.canResume}
      <Button size="sm" variant="default" onclick={onResume} class="flex-1">
        {$t('ai_assistant.resume')}
      </Button>
    {/if}
  </div>

  {#if !runState.isStopped}
    <p class="ui:text-muted-foreground text-[11px] leading-snug">
      {$t('ai_assistant.run_monitor.input_disabled_hint')}
    </p>
  {/if}
</div>
