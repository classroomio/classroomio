<script lang="ts">
  import { getQuestionTypeById } from '@cio/question-types';
  import { Badge } from '@cio/ui/base/badge';
  import { Button } from '@cio/ui/base/button';
  import { QuestionTypeIcon } from '@cio/ui';
  import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';
  import TriangleAlertIcon from '@lucide/svelte/icons/triangle-alert';
  import type { NonAutoGradableQuestionOffender } from '@cio/utils/validation/course';
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { t } from '$lib/utils/functions/translations';
  import { groupOffendersByExercise } from '../../utils/public-conversion-utils';
  import { publicConversionFlow } from '../../store/public-conversion.svelte';
  import type { Course } from '../../utils/types';

  interface Props {
    course: Course;
    offenders: NonAutoGradableQuestionOffender[];
    onCancel?: () => void;
    disabled?: boolean;
    class?: string;
  }

  let { course, offenders, onCancel, disabled = false, class: className = '' }: Props = $props();

  const groups = $derived(groupOffendersByExercise(offenders, course));
  const totalQuestions = $derived(offenders.length);
  const totalExercises = $derived(groups.length);
  const questionCountBadge = $derived(
    totalQuestions === 1
      ? $t('course.navItem.settings.public_conversion.question_count_singular', { count: totalQuestions })
      : $t('course.navItem.settings.public_conversion.question_count_plural', { count: totalQuestions })
  );
  const exerciseCountBadge = $derived(
    totalExercises === 1
      ? $t('course.navItem.settings.public_conversion.exercise_count_singular', { count: totalExercises })
      : $t('course.navItem.settings.public_conversion.exercise_count_plural', { count: totalExercises })
  );

  function handleFixExercise(exerciseId: string, questionId?: string | number) {
    if (disabled) return;

    // Start or update conversion flow tracking
    publicConversionFlow.start(course.id, offenders);

    // Target the specific question or the first offending question in the exercise
    const targetQuestionId = questionId ?? groups.find((g) => g.exerciseId === exerciseId)?.questions[0]?.questionId;
    const highlightQuery = targetQuestionId
      ? `?highlight=exercise-question-${targetQuestionId}&tab=questions`
      : '?tab=questions';

    // Navigate to exercise editor with conversion context
    goto(resolve(`/courses/${course.id}/exercises/${exerciseId}${highlightQuery}`, {}));
  }
</script>

<div class="ui:border-destructive/40 w-full space-y-4 rounded-lg border p-4 {className}" role="alert">
  <div class="flex items-start gap-3">
    <TriangleAlertIcon class="ui:stroke-destructive h-5 w-5 shrink-0 translate-y-0.5" />
    <div class="min-w-0 flex-1">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <h4 class="ui:text-foreground text-sm font-semibold">
          {$t('course.navItem.settings.convert_to_public_blocked')}
        </h4>
        <div class="flex items-center gap-1.5">
          <Badge variant="destructive" class="text-xs">
            {questionCountBadge}
          </Badge>
          <Badge variant="outline" class="text-xs">
            {exerciseCountBadge}
          </Badge>
        </div>
      </div>
      <p class="ui:text-muted-foreground mt-1 text-xs leading-relaxed">
        {$t('course.navItem.settings.convert_to_public_blocked_desc')}
      </p>
      {#if disabled}
        <p class="mt-2 text-xs font-medium text-amber-600 dark:text-amber-400">
          {$t('course.navItem.settings.save_changes_to_fix_questions')}
        </p>
      {/if}
    </div>
  </div>

  {#if groups.length > 0}
    <div class="space-y-3">
      {#each groups as group (group.exerciseId)}
        <div class="ui:rounded-md ui:border ui:bg-background ui:p-3.5 space-y-2.5 shadow-xs">
          <div class="flex items-center justify-between gap-3 border-b pb-2">
            <div class="flex min-w-0 flex-1 items-center gap-2">
              <span
                class="ui:text-foreground max-w-32 truncate text-sm font-medium md:max-w-32"
                title={group.exerciseTitle}
              >
                {group.exerciseTitle}
              </span>
              <Badge variant="secondary" class="shrink-0 text-[11px]">
                {group.questions.length === 1
                  ? $t('course.navItem.settings.public_conversion.question_count_singular', {
                      count: group.questions.length
                    })
                  : $t('course.navItem.settings.public_conversion.question_count_plural', {
                      count: group.questions.length
                    })}
              </Badge>
            </div>
            <Button
              variant="outline"
              size="sm"
              class="h-7 shrink-0 gap-1.5 text-xs"
              {disabled}
              onclick={() => handleFixExercise(group.exerciseId, group.questions[0]?.questionId)}
            >
              <span class="hidden md:inline">{$t('course.navItem.settings.fix_in_exercise')}</span>
              <span class="inline md:hidden">{$t('course.navItem.settings.fix')}</span>
              <ArrowRightIcon class="h-3.5 w-3.5" />
            </Button>
          </div>

          <div class="space-y-1.5">
            {#each group.questions as question, index (question.questionId)}
              {@const questionTypeMeta = getQuestionTypeById(question.typeId)}
              {@const questionLabel =
                question.questionTitle ||
                $t('course.navItem.settings.public_conversion.question_fallback', { number: index + 1 })}
              <button
                type="button"
                class="ui:bg-muted/40 ui:hover:bg-muted/70 flex w-full cursor-pointer items-center justify-between gap-3 rounded-md px-2.5 py-1.5 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                {disabled}
                onclick={() => handleFixExercise(group.exerciseId, question.questionId)}
              >
                <div class="flex min-w-0 flex-1 items-center gap-2.5">
                  <QuestionTypeIcon typeId={question.typeId} class="ui:size-6 shrink-0 rounded" />
                  <span
                    class="ui:text-foreground max-w-28 truncate text-xs font-medium md:max-w-44"
                    title={questionLabel}
                  >
                    {questionLabel}
                  </span>
                </div>
                {#if questionTypeMeta?.label}
                  <Badge variant="outline" class="shrink-0 text-[10px] font-normal">
                    {questionTypeMeta.label}
                  </Badge>
                {/if}
              </button>
            {/each}
          </div>
        </div>
      {/each}
    </div>
  {/if}

  {#if onCancel}
    <div class="ui:border-foreground/20 flex justify-end border-t pt-1">
      <Button
        variant="ghost"
        size="sm"
        class="ui:text-muted-foreground ui:hover:text-foreground text-xs"
        onclick={onCancel}
      >
        {$t('course.navItem.settings.cancel_conversion')}
      </Button>
    </div>
  {/if}
</div>
