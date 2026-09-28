<script lang="ts">
  import { onDestroy } from 'svelte';
  import { Clock, Play, Pause, RotateCcw, BookOpen } from '@lucide/svelte';
  import { isCourseLearnerView, isOrgStudent, isStudentExperience } from '$lib/utils/store/app';
  import { isFocusMode, toggleFocusMode, exitFocusMode } from '$features/course/store/focus-mode';

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

  const isLearner = $derived(Boolean($isCourseLearnerView || $isOrgStudent || $isStudentExperience));

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

  function handleFocusModeClick() {
    toggleFocusMode();
    if (!isRunning) {
      startTimer();
    }
  }

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
    exitFocusMode();
  });
</script>

{#if isLearner}
  {#if $isFocusMode}
    <!-- Floating Minimal Focus Bar at top of screen -->
    <div
      class="border-border/70 bg-background/90 fixed top-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-full border px-4 py-1.5 text-xs shadow-lg backdrop-blur-md transition-all duration-300"
      data-testid="focus-mode-indicator"
    >
      <div class="text-foreground flex items-center gap-1.5 font-medium">
        <BookOpen class="text-primary h-3.5 w-3.5" />
        <span>Focus Mode</span>
      </div>
      <span class="text-muted-foreground/50">·</span>
      <div class="text-muted-foreground flex items-center gap-1.5 font-mono tabular-nums">
        <Clock class="h-3 w-3" />
        <span>{formattedTime}</span>
      </div>
      <span class="text-muted-foreground/50">·</span>
      <button
        type="button"
        onclick={exitFocusMode}
        class="hover:bg-muted text-muted-foreground hover:text-foreground text-2xs inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 font-semibold transition-colors"
      >
        <span>Exit</span>
        <kbd class="bg-muted text-muted-foreground border-border/60 text-2xs rounded border px-1 py-0.5 font-mono"
          >Esc</kbd
        >
      </button>
    </div>
  {/if}

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
        onclick={handleFocusModeClick}
        class="text-muted-foreground hover:bg-muted hover:text-foreground inline-flex items-center gap-1 rounded-md px-2 py-1 font-medium transition-colors"
      >
        <BookOpen class="h-3 w-3" />
        <span>{$isFocusMode ? 'Exit Focus' : 'Focus Mode'}</span>
      </button>
    </div>
  </div>
{/if}
