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
    canRetry: boolean;
    canResume: boolean;
  }

  /** Queued for longer than this with no worker pickup = surface "worker not responding". */
  const STUCK_QUEUED_THRESHOLD_MS = 30_000;

  interface Props {
    state: RunMonitorState;
    courseId: string;
    /** Underlying run status; used to enable Dismiss only on canceled runs. */
    runStatus?: string | null;
    /** When run is `queued`, the ISO timestamp it was enqueued. Lets us flag stuck-queued runs. */
    queuedSince?: string | null;
    onCancel: () => void;
    onResume: () => void;
    onRetry: () => void;
    onDismiss: () => void;
    onRetryStuck?: () => void;
    onMentionClick: (route: string) => void;
  }

  let {
    state: runState,
    courseId,
    runStatus = null,
    queuedSince = null,
    onCancel,
    onResume,
    onRetry,
    onDismiss,
    onRetryStuck,
    onMentionClick
  }: Props = $props();

  const isCanceled = $derived(runStatus === 'canceled');

  // `now` ticks every 5s so the stuck-queued detector keeps re-evaluating even
  // when the run row itself isn't changing (which is exactly the symptom we're
  // trying to catch — the worker isn't moving the row past `queued`).
  let now = $state(Date.now());
  onMount(() => {
    const id = setInterval(() => (now = Date.now()), 5_000);
    return () => clearInterval(id);
  });

  const isStuckQueued = $derived.by(() => {
    if (runStatus !== 'queued' || !queuedSince) return false;
    const queuedAt = Date.parse(queuedSince);
    if (!Number.isFinite(queuedAt)) return false;
    return now - queuedAt > STUCK_QUEUED_THRESHOLD_MS;
  });

  // Two-step Dismiss: first click reveals a confirm/cancel pair so the user
  // can't accidentally walk away from a canceled run and lose the Resume button.
  let isConfirmingDismiss = $state(false);

  function requestDismiss() {
    isConfirmingDismiss = true;
  }

  function confirmDismiss() {
    isConfirmingDismiss = false;
    onDismiss();
  }

  function cancelDismiss() {
    isConfirmingDismiss = false;
  }

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

  {#if isStuckQueued}
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
        <Button size="sm" variant="outline" onclick={onRetryStuck} class="shrink-0">
          {$t('ai_assistant.retry')}
        </Button>
      {/if}
    </div>
  {/if}

  <div class="flex gap-2">
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
    {#if isCanceled && !isConfirmingDismiss}
      <Button size="sm" variant="ghost" onclick={requestDismiss} class="flex-1">
        {$t('ai_assistant.run_monitor.dismiss')}
      </Button>
    {/if}
  </div>

  {#if isCanceled && isConfirmingDismiss}
    <div class="ui:bg-muted/30 flex flex-col gap-2 rounded border px-3 py-2 text-xs">
      <p class="ui:text-foreground">{$t('ai_assistant.run_monitor.dismiss_confirm_body')}</p>
      <div class="flex gap-2">
        <Button size="sm" variant="ghost" onclick={cancelDismiss} class="flex-1">
          {$t('ai_assistant.run_monitor.dismiss_cancel')}
        </Button>
        <Button size="sm" variant="destructive" onclick={confirmDismiss} class="flex-1">
          {$t('ai_assistant.run_monitor.dismiss_confirm')}
        </Button>
      </div>
    </div>
  {/if}

  <p class="ui:text-muted-foreground text-[11px] leading-snug">
    {$t('ai_assistant.run_monitor.input_disabled_hint')}
  </p>
</div>
