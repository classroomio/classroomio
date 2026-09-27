<script lang="ts">
  import { onDestroy } from 'svelte';
  import { Clock, Play, Pause, RotateCcw, BookOpen } from '@lucide/svelte';

  interface Props {
    lesson?: {
      title?: string;
      content?: string;
      body?: string;
      [key: string]: any;
    };
    lessonId?: string;
    courseId?: string;
    [key: string]: any;
  }

  let { lesson = {} }: Props = $props();

  // Word count & reading time calculation
  const readingStats = $derived.by(() => {
    const rawText = (lesson.content || lesson.body || '')
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    const wordCount = rawText ? rawText.split(' ').length : 0;
    const minutes = Math.max(1, Math.ceil(wordCount / 200));

    return {
      wordCount,
      minutes,
      label: `${minutes} min read`
    };
  });

  // Focus stopwatch state
  let isTimerOpen = $state(false);
  let isRunning = $state(false);
  let secondsElapsed = $state(0);
  let intervalId: ReturnType<typeof setInterval> | null = null;

  function toggleTimer() {
    isTimerOpen = !isTimerOpen;
  }

  function startTimer() {
    if (isRunning) return;
    isRunning = true;
    intervalId = setInterval(() => {
      secondsElapsed += 1;
    }, 1000);
  }

  function pauseTimer() {
    isRunning = false;
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  }

  function resetTimer() {
    pauseTimer();
    secondsElapsed = 0;
  }

  const formattedTime = $derived.by(() => {
    const mins = Math.floor(secondsElapsed / 60);
    const secs = secondsElapsed % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  });

  onDestroy(() => {
    if (intervalId) clearInterval(intervalId);
  });
</script>

<div
  class="border-border/60 bg-muted/30 my-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2 text-xs"
>
  <div class="text-muted-foreground flex items-center gap-2">
    <Clock class="text-primary h-3.5 w-3.5" />
    <span class="text-foreground font-medium">{readingStats.label}</span>
    <span class="text-muted-foreground/60">·</span>
    <span class="text-muted-foreground">{readingStats.wordCount} words</span>
  </div>

  <div class="flex items-center gap-2">
    {#if isTimerOpen}
      <div class="border-border bg-background flex items-center gap-1.5 rounded-md border px-2 py-0.5 shadow-2xs">
        <span class="text-foreground font-mono text-xs font-semibold tabular-nums">{formattedTime}</span>
        {#if !isRunning}
          <button
            type="button"
            onclick={startTimer}
            class="text-muted-foreground hover:text-primary p-0.5 transition-colors"
            title="Start Timer"
            aria-label="Start Timer"
          >
            <Play class="h-3 w-3 fill-current" />
          </button>
        {:else}
          <button
            type="button"
            onclick={pauseTimer}
            class="p-0.5 text-amber-500 transition-colors hover:text-amber-600"
            title="Pause Timer"
            aria-label="Pause Timer"
          >
            <Pause class="h-3 w-3 fill-current" />
          </button>
        {/if}
        <button
          type="button"
          onclick={resetTimer}
          class="text-muted-foreground hover:text-foreground p-0.5 transition-colors"
          title="Reset Timer"
          aria-label="Reset Timer"
        >
          <RotateCcw class="h-3 w-3" />
        </button>
      </div>
    {/if}

    <button
      type="button"
      onclick={toggleTimer}
      class="text-muted-foreground hover:bg-muted hover:text-foreground inline-flex items-center gap-1 rounded-md px-2 py-1 font-medium transition-colors"
    >
      <BookOpen class="h-3 w-3" />
      <span>{isTimerOpen ? 'Hide Focus' : 'Focus Mode'}</span>
    </button>
  </div>
</div>
