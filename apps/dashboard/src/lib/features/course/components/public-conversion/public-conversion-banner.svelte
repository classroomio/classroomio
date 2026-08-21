<script lang="ts">
  import { tick } from 'svelte';
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { Badge } from '@cio/ui/base/badge';
  import { Button } from '@cio/ui/base/button';
  import { QuestionTypeIcon } from '@cio/ui';
  import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';
  import CheckCircleIcon from '@lucide/svelte/icons/check-circle';
  import SparklesIcon from '@lucide/svelte/icons/sparkles';
  import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
  import { t } from '$lib/utils/functions/translations';
  import { snackbar } from '$features/ui/snackbar/store';
  import { courseApi } from '$features/course/api';
  import { publicConversionFlow } from '../../store/public-conversion.svelte';
  import { questionnaire } from '../exercise/store';
  import { getActiveExerciseQuestions } from '../../utils/exercise-progression-utils';
  import { getQuestionTypeId } from '../exercise/question-type-utils';
  import { isQuestionAutoGradable } from '../../utils/public-conversion-utils';

  interface Props {
    exerciseId: string;
  }

  let { exerciseId }: Props = $props();

  let isConverting = $state(false);

  const course = $derived(courseApi.course);
  const courseId = $derived(course?.id ?? '');

  const activeQuestions = $derived(getActiveExerciseQuestions($questionnaire.questions ?? []));

  const currentExerciseManualQuestions = $derived(
    activeQuestions.filter((q) => !isQuestionAutoGradable(getQuestionTypeId(q)))
  );

  const isCurrentExerciseResolved = $derived(currentExerciseManualQuestions.length === 0);

  const countdown = $derived(publicConversionFlow.getCountdown(course, exerciseId, $questionnaire.questions));

  const nextExercise = $derived(publicConversionFlow.getNextExercise(course, exerciseId));

  function scrollToQuestion(questionId: string | number) {
    tick().then(() => {
      const el = document.getElementById(`exercise-question-${questionId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
  }

  function handleNextExercise() {
    if (!nextExercise || !courseId) return;
    goto(resolve(`/courses/${courseId}/exercises/${nextExercise.exerciseId}?fromPublicConversion=true`, {}));
  }

  async function handleCompleteConversion() {
    if (!courseId || isConverting) return;

    isConverting = true;
    try {
      const response = await courseApi.update(courseId, { type: 'PUBLIC' });

      if (courseApi.success && response) {
        publicConversionFlow.reset();
        snackbar.success('snackbar.course_settings.success.converted_to_public');
        goto(resolve(`/courses/${courseId}/settings`, {}));
      }
    } catch (error) {
      console.error(error);
      snackbar.error();
    } finally {
      isConverting = false;
    }
  }

  function handleBackToSettings() {
    if (!courseId) return;
    goto(resolve(`/courses/${courseId}/settings`, {}));
  }
</script>

{#if publicConversionFlow.isActive && publicConversionFlow.courseId === courseId}
  <div
    class="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-amber-950 shadow-xs dark:border-amber-500/20 dark:bg-amber-950/30 dark:text-amber-100"
    role="region"
    aria-label="Public course conversion progress"
  >
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div class="flex min-w-0 items-start gap-2.5">
        <span
          class="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400"
        >
          {#if countdown.isFullyResolved}
            <CheckCircleIcon class="size-3.5 text-emerald-500" />
          {:else}
            <SparklesIcon class="size-3.5" />
          {/if}
        </span>
        <div class="min-w-0">
          <div class="flex flex-wrap items-center gap-2">
            <span class="text-xs font-semibold tracking-wider text-amber-700 uppercase dark:text-amber-300">
              {$t('course.navItem.settings.public_conversion.banner_title')}
            </span>
            <Badge variant="outline" class="border-amber-500/40 text-[10px] font-normal text-inherit">
              {countdown.resolvedExercises}/{countdown.totalExercises} exercises fixed ({countdown.percentComplete}%)
            </Badge>
          </div>
          <p class="mt-0.5 text-xs text-amber-800/80 dark:text-amber-200/80">
            {#if isCurrentExerciseResolved}
              <span class="font-medium text-emerald-700 dark:text-emerald-300">
                ✓ {$t('course.navItem.settings.public_conversion.exercise_fixed')}
              </span>
              {#if countdown.remainingQuestions > 0}
                — {countdown.remainingQuestions} more in other exercises.
              {:else}
                — All exercises in this course are now auto-gradable!
              {/if}
            {:else}
              <span>
                {currentExerciseManualQuestions.length} non-autogradable {currentExerciseManualQuestions.length === 1
                  ? 'question'
                  : 'questions'} left in this exercise.
              </span>
            {/if}
          </p>

          {#if !isCurrentExerciseResolved && currentExerciseManualQuestions.length > 0}
            <div class="mt-2 flex flex-wrap items-center gap-1.5">
              <span class="text-[11px] font-medium text-amber-900/70 dark:text-amber-100/70">
                {$t('course.navItem.settings.public_conversion.jump_to')}:
              </span>
              {#each currentExerciseManualQuestions as q, index (q.id)}
                {@const typeId = getQuestionTypeId(q)}
                <button
                  type="button"
                  class="flex cursor-pointer items-center gap-1 rounded bg-amber-500/20 px-2 py-0.5 text-[11px] font-medium text-amber-900 transition-colors hover:bg-amber-500/30 dark:text-amber-100"
                  onclick={() => scrollToQuestion(q.id)}
                >
                  <QuestionTypeIcon {typeId} class="ui:size-4 rounded-xs text-[9px]" />
                  <span class="max-w-28 truncate">{q.title || `Question ${index + 1}`}</span>
                </button>
              {/each}
            </div>
          {/if}
        </div>
      </div>

      <div class="flex shrink-0 flex-wrap items-center gap-2 self-end sm:self-auto">
        <Button
          variant="ghost"
          size="sm"
          class="h-7 text-xs text-amber-800 hover:bg-amber-500/20 dark:text-amber-200"
          onclick={handleBackToSettings}
        >
          <ArrowLeftIcon class="mr-1 size-3" />
          {$t('course.navItem.settings.public_conversion.back_to_settings')}
        </Button>

        {#if countdown.isFullyResolved}
          <Button
            size="sm"
            class="h-7 cursor-pointer gap-1.5 bg-emerald-600 text-xs text-white shadow-sm hover:bg-emerald-700"
            loading={isConverting}
            onclick={handleCompleteConversion}
          >
            <SparklesIcon class="size-3.5" />
            {$t('course.navItem.settings.public_conversion.complete_conversion')}
          </Button>
        {:else if nextExercise}
          <Button
            variant="outline"
            size="sm"
            class="h-7 cursor-pointer gap-1.5 border-amber-500/40 text-xs hover:bg-amber-500/20"
            onclick={handleNextExercise}
          >
            <span class="max-w-28 truncate sm:max-w-44">Next: {nextExercise.exerciseTitle}</span>
            <ArrowRightIcon class="size-3.5" />
          </Button>
        {/if}
      </div>
    </div>
  </div>
{/if}
