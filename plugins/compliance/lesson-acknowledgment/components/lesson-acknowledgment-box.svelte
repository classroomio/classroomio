<script lang="ts">
  import { browser } from '$app/environment';
  import { ShieldCheck, CheckCircle2, Clock, RotateCcw } from '@lucide/svelte';

  interface Props {
    lessonId?: string;
    courseId?: string;
    lesson?: {
      id?: string;
      title?: string;
      [key: string]: any;
    };
    [key: string]: any;
  }

  let { lessonId, courseId, lesson }: Props = $props();

  const effectiveLessonId = $derived(lessonId || lesson?.id || '');

  let isAcknowledged = $state(false);
  let acknowledgedAt = $state<string | null>(null);

  const storageKey = $derived(effectiveLessonId ? `cio_ack_${effectiveLessonId}` : null);

  $effect(() => {
    if (!browser || !storageKey) return;
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        isAcknowledged = Boolean(parsed.acknowledged);
        acknowledgedAt = parsed.timestamp || null;
      } else {
        isAcknowledged = false;
        acknowledgedAt = null;
      }
    } catch {
      isAcknowledged = false;
      acknowledgedAt = null;
    }
  });

  function handleAcknowledge() {
    if (!browser || !storageKey) return;
    const nowIso = new Date().toISOString();
    try {
      localStorage.setItem(storageKey, JSON.stringify({ acknowledged: true, timestamp: nowIso }));
      isAcknowledged = true;
      acknowledgedAt = nowIso;
    } catch (e) {
      console.error('Failed to save acknowledgment', e);
    }
  }

  function handleReset() {
    if (!browser || !storageKey) return;
    try {
      localStorage.removeItem(storageKey);
      isAcknowledged = false;
      acknowledgedAt = null;
    } catch (e) {
      console.error('Failed to clear acknowledgment', e);
    }
  }

  const formattedTimestamp = $derived.by(() => {
    if (!acknowledgedAt) return '';
    try {
      return new Date(acknowledgedAt).toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short'
      });
    } catch {
      return acknowledgedAt;
    }
  });
</script>

{#if effectiveLessonId}
  <div class="my-6" data-testid="lesson-acknowledgment-box">
    {#if isAcknowledged}
      <div
        class="flex flex-col gap-3 rounded-xl border border-emerald-500/25 bg-emerald-500/5 p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between sm:p-5"
      >
        <div class="flex items-start gap-3">
          <div
            class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
          >
            <CheckCircle2 class="h-5 w-5" />
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h4 class="text-foreground text-sm font-semibold">Compliance Acknowledged</h4>
              <span
                class="text-2xs inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 font-semibold text-emerald-700 dark:text-emerald-300"
              >
                Verified
              </span>
            </div>
            <p class="text-muted-foreground mt-0.5 text-xs">
              You confirmed understanding on <span class="text-foreground font-medium">{formattedTimestamp}</span>.
            </p>
          </div>
        </div>

        <button
          type="button"
          onclick={handleReset}
          class="text-2xs text-muted-foreground hover:text-foreground hover:bg-muted inline-flex items-center gap-1.5 self-end rounded-lg px-2.5 py-1 font-medium transition-colors sm:self-auto"
          title="Reset acknowledgment state for this lesson"
        >
          <RotateCcw class="h-3 w-3" />
          <span>Reset</span>
        </button>
      </div>
    {:else}
      <div class="border-border bg-card rounded-xl border p-4 shadow-xs sm:p-5">
        <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div class="flex items-start gap-3.5">
            <div class="bg-primary/10 text-primary flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
              <ShieldCheck class="h-5 w-5" />
            </div>
            <div>
              <h4 class="text-foreground text-sm font-semibold">Lesson Completion Acknowledgment</h4>
              <p class="text-muted-foreground mt-0.5 text-xs">
                Please confirm that you have reviewed and understood all materials presented in this lesson.
              </p>
            </div>
          </div>

          <button
            type="button"
            onclick={handleAcknowledge}
            class="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex shrink-0 items-center justify-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold shadow-xs transition-colors sm:text-sm"
          >
            <ShieldCheck class="h-4 w-4" />
            <span>Confirm Understanding</span>
          </button>
        </div>
      </div>
    {/if}
  </div>
{/if}
