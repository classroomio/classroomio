<script lang="ts">
  import { browser } from '$app/environment';
  import { ShieldCheck, CheckCircle2, RotateCcw, Check, Loader2 } from '@lucide/svelte';
  import { isCourseLearnerView, isOrgStudent, isStudentExperience } from '$lib/utils/store/app';
  import { toggleLessonCompletion } from '$features/course/utils/toggle-lesson-completion';
  import { t } from '$lib/utils/functions/translations';

  interface Props {
    lessonId?: string;
    courseId?: string;
    lesson?: {
      id?: string;
      title?: string;
      isComplete?: boolean;
      [key: string]: any;
    };
    [key: string]: any;
  }

  let { lessonId, courseId, lesson }: Props = $props();

  const isLearner = $derived(Boolean($isCourseLearnerView || $isOrgStudent || $isStudentExperience));
  const effectiveLessonId = $derived(lessonId || lesson?.id || '');
  const isLessonComplete = $derived(Boolean(lesson?.isComplete));

  let isAcknowledged = $state(false);
  let acknowledgedAt = $state<string | null>(null);
  let isSubmitting = $state(false);

  const storageKey = $derived(effectiveLessonId ? `cio_ack_${effectiveLessonId}` : null);

  $effect(() => {
    if (!browser || !storageKey) return;
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        isAcknowledged = Boolean(parsed.acknowledged);
        acknowledgedAt = parsed.timestamp || null;
      } else if (isLessonComplete) {
        isAcknowledged = true;
      } else {
        isAcknowledged = false;
        acknowledgedAt = null;
      }
    } catch {
      isAcknowledged = isLessonComplete;
      acknowledgedAt = null;
    }
  });

  async function handleAcknowledge() {
    if (!browser || !storageKey || isSubmitting) return;
    isSubmitting = true;
    const nowIso = new Date().toISOString();
    try {
      localStorage.setItem(storageKey, JSON.stringify({ acknowledged: true, timestamp: nowIso }));
      isAcknowledged = true;
      acknowledgedAt = nowIso;

      if (courseId && effectiveLessonId && !isLessonComplete) {
        await toggleLessonCompletion(courseId, effectiveLessonId);
      }
    } catch (e) {
      console.error('Failed to save acknowledgment', e);
    } finally {
      isSubmitting = false;
    }
  }

  async function handleReset() {
    if (!browser || !storageKey || isSubmitting) return;
    isSubmitting = true;
    try {
      localStorage.removeItem(storageKey);
      isAcknowledged = false;
      acknowledgedAt = null;

      if (courseId && effectiveLessonId && isLessonComplete) {
        await toggleLessonCompletion(courseId, effectiveLessonId);
      }
    } catch (e) {
      console.error('Failed to clear acknowledgment', e);
    } finally {
      isSubmitting = false;
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

{#if isLearner && effectiveLessonId}
  <div class="my-3.5" data-testid="lesson-acknowledgment-box">
    {#if isAcknowledged}
      <div
        class="border-border/60 bg-muted/20 flex flex-wrap items-center justify-between gap-2.5 rounded-lg border px-3.5 py-2 text-xs"
      >
        <div class="flex items-center gap-2">
          <CheckCircle2 class="h-4 w-4 text-emerald-500" />
          <span class="text-foreground font-medium">{$t('plugins.lesson_acknowledgment.understood')}</span>
          {#if formattedTimestamp}
            <span class="text-muted-foreground/60">·</span>
            <span class="text-muted-foreground">{formattedTimestamp}</span>
          {/if}
        </div>

        <button
          type="button"
          onclick={handleReset}
          disabled={isSubmitting}
          class="text-muted-foreground hover:text-foreground hover:bg-muted inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs transition-colors disabled:opacity-50"
          title="Reset acknowledgment"
        >
          {#if isSubmitting}
            <Loader2 class="h-3 w-3 animate-spin" />
          {:else}
            <RotateCcw class="h-3 w-3" />
          {/if}
          <span>{$t('plugins.lesson_acknowledgment.undo')}</span>
        </button>
      </div>
    {:else}
      <div
        class="border-border/60 bg-muted/20 flex flex-wrap items-center justify-between gap-3 rounded-lg border px-3.5 py-2 text-xs"
      >
        <div class="text-muted-foreground flex items-center gap-2">
          <ShieldCheck class="text-primary/70 h-4 w-4" />
          <span>{$t('plugins.lesson_acknowledgment.prompt')}</span>
        </div>

        <button
          type="button"
          onclick={handleAcknowledge}
          disabled={isSubmitting}
          class="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-1.5 rounded-md px-3 py-1 font-medium shadow-2xs transition-colors disabled:opacity-50"
        >
          {#if isSubmitting}
            <Loader2 class="h-3.5 w-3.5 animate-spin" />
          {:else}
            <Check class="h-3.5 w-3.5" />
          {/if}
          <span>{$t('plugins.lesson_acknowledgment.acknowledge')}</span>
        </button>
      </div>
    {/if}
  </div>
{/if}
