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
  }

  let { course, offenders, onCancel }: Props = $props();

  const groups = $derived(groupOffendersByExercise(offenders, course));
  const totalQuestions = $derived(offenders.length);
  const totalExercises = $derived(groups.length);

  function handleFixExercise(exerciseId: string) {
    // Start or update conversion flow tracking
    publicConversionFlow.start(course.id, offenders);

    // Navigate to exercise editor with conversion context
    goto(resolve(`/courses/${course.id}/exercises/${exerciseId}?fromPublicConversion=true`, {}));
  }
</script>

<div class="ui:rounded-lg ui:border ui:border-destructive/40 ui:bg-destructive/5 ui:p-4 ui:space-y-4" role="alert">
  <div class="flex items-start gap-3">
    <TriangleAlertIcon class="ui:stroke-destructive h-5 w-5 shrink-0 translate-y-0.5" />
    <div class="min-w-0 flex-1">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <h4 class="ui:text-foreground text-sm font-semibold">
          {$t('course.navItem.settings.convert_to_public_blocked')}
        </h4>
        <div class="flex items-center gap-1.5">
          <Badge variant="destructive" class="text-xs">
            {totalQuestions}
            {totalQuestions === 1 ? 'question' : 'questions'}
          </Badge>
          <Badge variant="outline" class="text-xs">
            {totalExercises}
            {totalExercises === 1 ? 'exercise' : 'exercises'}
          </Badge>
        </div>
      </div>
      <p class="ui:text-muted-foreground mt-1 text-xs leading-relaxed">
        {$t('course.navItem.settings.convert_to_public_blocked_desc')}
      </p>
    </div>
  </div>

  {#if groups.length > 0}
    <div class="space-y-3">
      {#each groups as group (group.exerciseId)}
        <div class="ui:rounded-md ui:border ui:bg-background ui:p-3.5 space-y-2.5 shadow-xs">
          <div class="flex items-center justify-between gap-3 border-b pb-2">
            <div class="flex min-w-0 items-center gap-2">
              <span
                class="ui:text-foreground max-w-44 truncate text-sm font-medium sm:max-w-64 md:max-w-80"
                title={group.exerciseTitle}
              >
                {group.exerciseTitle}
              </span>
              <Badge variant="secondary" class="shrink-0 text-[11px]">
                {group.questions.length}
                {group.questions.length === 1 ? 'question' : 'questions'}
              </Badge>
            </div>
            <Button
              variant="outline"
              size="sm"
              class="h-7 shrink-0 gap-1.5 text-xs"
              onclick={() => handleFixExercise(group.exerciseId)}
            >
              <span>{$t('course.navItem.settings.fix_in_exercise')}</span>
              <ArrowRightIcon class="h-3.5 w-3.5" />
            </Button>
          </div>

          <div class="space-y-1.5">
            {#each group.questions as question (question.questionId)}
              {@const questionTypeMeta = getQuestionTypeById(question.typeId)}
              <div class="ui:bg-muted/40 flex items-center justify-between gap-3 rounded-md px-2.5 py-1.5">
                <div class="flex min-w-0 flex-1 items-center gap-2.5">
                  <QuestionTypeIcon typeId={question.typeId} class="ui:size-6 rounded" />
                  <span
                    class="ui:text-foreground max-w-40 truncate text-xs font-medium sm:max-w-64 md:max-w-72"
                    title={question.questionTitle}
                  >
                    {question.questionTitle}
                  </span>
                </div>
                {#if questionTypeMeta?.label}
                  <Badge variant="outline" class="shrink-0 text-[10px] font-normal">
                    {questionTypeMeta.label}
                  </Badge>
                {/if}
              </div>
            {/each}
          </div>
        </div>
      {/each}
    </div>
  {/if}

  {#if onCancel}
    <div class="border-destructive/20 flex justify-end border-t pt-1">
      <Button variant="ghost" size="sm" class="text-muted-foreground hover:text-foreground text-xs" onclick={onCancel}>
        {$t('course.navItem.settings.cancel_conversion')}
      </Button>
    </div>
  {/if}
</div>
