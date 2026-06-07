<script lang="ts">
  import { tick } from 'svelte';
  import { SvelteMap, SvelteSet } from 'svelte/reactivity';
  import CheckIcon from '@lucide/svelte/icons/check';
  import LoaderIcon from '@lucide/svelte/icons/loader';
  import CircleIcon from '@lucide/svelte/icons/circle';
  import AlertCircleIcon from '@lucide/svelte/icons/alert-circle';
  import SquareIcon from '@lucide/svelte/icons/square';
  import { Button } from '@cio/ui/base/button';
  import ToolLine from '$features/ai-assistant/utils/tool-line.svelte';
  import type { ProgressStep, ToolLineUi } from '$features/ai-assistant/utils/tool-labels';
  import { t } from '$lib/utils/functions/translations';

  interface Props {
    titleKey: string;
    steps: ProgressStep[];
    courseId: string;
    /** Same handler as `@mention` clicks (SPA navigation into lesson / exercise). */
    onNavigate: (route: string) => void;
    currentActionLine?: ToolLineUi;
    onStop?: () => void;
    isStopped?: boolean;
    error?: string;
    showTitle?: boolean;
  }

  let {
    titleKey,
    steps,
    courseId,
    onNavigate,
    currentActionLine,
    onStop,
    isStopped = false,
    error,
    showTitle = true
  }: Props = $props();

  /** Per-char delay for typewriter — adjusted down for long lines to stay under TYPEWRITER_MAX_MS total. */
  const TYPEWRITER_MS_PER_CHAR = 25;
  const TYPEWRITER_MAX_MS = 1500;
  /** "At the bottom" tolerance — same idea as `chat-message-list.svelte`. */
  const SCROLL_PIN_THRESHOLD = 40;

  function stepRowKey(step: ProgressStep, index: number): string {
    if (step.line.shape === 'i18n') {
      return `${index}-${step.line.key}-${JSON.stringify(step.line.vars ?? {})}`;
    }

    if (step.line.shape === 'lesson_written') {
      return `${index}-lesson-${step.line.lessonId}-${step.line.charCount}-${step.line.title}`;
    }

    if (step.line.shape === 'landing_page_updated') {
      return `${index}-landing-${step.line.title}`;
    }

    return `${index}-exo-${step.line.exerciseId}-${step.line.action}-${step.line.count}-${step.line.title}`;
  }

  // ─── Typewriter ────────────────────────────────────────────────────────────
  // Only i18n-shape lines animate (those are plain text). Lines containing
  // mention links render in full immediately — partial-rendering a mention
  // would look broken.

  /** Step keys whose text has finished animating (or never needed to). */
  let animatedKeys = new SvelteSet<string>();
  /** key → currently-displayed substring during animation. */
  let animatingTexts = new SvelteMap<string, string>();

  function resolveI18nText(line: ToolLineUi): string | null {
    if (line.shape !== 'i18n') return null;
    return t.get(line.key, line.vars ?? {});
  }

  function startTypewriter(key: string, fullText: string) {
    if (fullText.length === 0) {
      animatedKeys.add(key);
      return;
    }

    // Squeeze the per-char delay so even long lines finish under the cap.
    const perCharDelay = Math.max(
      15,
      Math.min(TYPEWRITER_MS_PER_CHAR, Math.floor(TYPEWRITER_MAX_MS / fullText.length))
    );
    let revealed = 0;
    animatingTexts.set(key, '');

    const handle = setInterval(() => {
      revealed += 1;
      animatingTexts.set(key, fullText.slice(0, revealed));

      if (revealed >= fullText.length) {
        clearInterval(handle);
        animatingTexts.delete(key);
        animatedKeys.add(key);
      }
    }, perCharDelay);
  }

  // Detect newly arrived steps every render. Reading `steps` ties this effect
  // to step list growth.
  $effect(() => {
    for (let i = 0; i < steps.length; i++) {
      const key = stepRowKey(steps[i], i);
      if (animatedKeys.has(key) || animatingTexts.has(key)) continue;

      const text = resolveI18nText(steps[i].line);
      if (text === null) {
        // Non-i18n shape — render in full, skip the typewriter.
        animatedKeys.add(key);
        continue;
      }

      startTypewriter(key, text);
    }
  });

  // ─── Auto-scroll ───────────────────────────────────────────────────────────
  let stepsContainer: HTMLDivElement | undefined = $state();
  let isPinnedToBottom = $state(true);
  let lastSeenStepCount = 0;

  function handleScroll() {
    if (!stepsContainer) return;

    const distanceFromBottom = stepsContainer.scrollHeight - stepsContainer.scrollTop - stepsContainer.clientHeight;
    isPinnedToBottom = distanceFromBottom <= SCROLL_PIN_THRESHOLD;
  }

  $effect(() => {
    if (steps.length === lastSeenStepCount) return;

    const grew = steps.length > lastSeenStepCount;
    lastSeenStepCount = steps.length;

    if (grew && isPinnedToBottom) {
      void tick().then(() => {
        if (stepsContainer) {
          stepsContainer.scrollTop = stepsContainer.scrollHeight;
        }
      });
    }
  });

  const completedCount = $derived(steps.filter((s) => s.status === 'completed').length);
  const totalCount = $derived(steps.length);
</script>

<div class="ui:bg-background rounded-lg border">
  <!-- Header: title, progress count, and the prominent "now doing" strip -->
  <div class="space-y-1.5 border-b px-3 py-2">
    {#if showTitle}
      <h4 class="text-sm font-semibold">{$t(titleKey)}</h4>
    {/if}
    {#if totalCount > 0}
      <p class="ui:text-muted-foreground text-xs">
        {$t('ai_assistant.plan_progress', { completed: completedCount, total: totalCount })}
      </p>
    {/if}

    {#if currentActionLine && !isStopped}
      <div class="ui:bg-muted/40 flex items-center gap-2 rounded-md px-2 py-1.5 text-xs">
        <LoaderIcon size={14} class="ui:text-primary shrink-0 animate-spin" />
        <span class="ui:text-muted-foreground shrink-0 text-[10px] font-medium tracking-wide uppercase">
          {$t('ai_assistant.run_monitor.now_doing')}
        </span>
        <span class="ui:text-foreground min-w-0 flex-1 truncate">
          <ToolLine line={currentActionLine} {courseId} {onNavigate} />
        </span>
      </div>
    {/if}
  </div>

  <div bind:this={stepsContainer} onscroll={handleScroll} class="max-h-75 space-y-0.5 overflow-y-auto p-2">
    {#each steps as step, i (stepRowKey(step, i))}
      {@const rowKey = stepRowKey(step, i)}
      {@const animatingSlice = animatingTexts.get(rowKey)}
      {@const isAnimating = animatingSlice !== undefined && step.line.shape === 'i18n'}
      <div
        class="flex items-center gap-2 rounded px-2 py-1 text-xs {step.indent ? 'ml-4' : ''} {step.status ===
        'in_progress'
          ? 'animate-pulse'
          : ''}"
      >
        {#if step.status === 'completed'}
          <CheckIcon size={14} class="ui:text-primary shrink-0" />
        {:else if step.status === 'in_progress'}
          <LoaderIcon size={14} class="ui:text-primary shrink-0 animate-spin" />
        {:else if step.status === 'failed'}
          <AlertCircleIcon size={14} class="shrink-0 text-red-500" />
        {:else}
          <CircleIcon size={14} class="ui:text-muted-foreground shrink-0" />
        {/if}
        <span class={step.status === 'completed' ? '' : step.status === 'pending' ? 'ui:text-muted-foreground' : ''}>
          {#if isAnimating}
            {animatingSlice}
          {:else}
            <ToolLine line={step.line} {courseId} {onNavigate} />
          {/if}
        </span>
      </div>
    {/each}
  </div>

  <div class="space-y-1 border-t px-3 py-2">
    {#if error}
      <p class="text-xs text-red-600 dark:text-red-400">{error}</p>
    {/if}

    {#if isStopped}
      <p class="ui:text-muted-foreground text-xs">{$t('ai_assistant.stopped_content_kept')}</p>
    {/if}

    {#if onStop && !isStopped && completedCount < totalCount}
      <Button size="sm" variant="outline" onclick={onStop} class="w-full">
        <SquareIcon size={12} class="mr-1" />
        {$t('ai_assistant.stop')}
      </Button>
    {/if}
  </div>
</div>
