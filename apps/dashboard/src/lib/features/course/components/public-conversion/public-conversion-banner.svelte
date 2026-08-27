<script lang="ts">
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { Badge } from '@cio/ui/base/badge';
  import { Button } from '@cio/ui/base/button';
  import * as DropdownMenu from '@cio/ui/base/dropdown-menu';
  import * as Tooltip from '@cio/ui/base/tooltip';
  import { QuestionTypeIcon } from '@cio/ui';
  import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
  import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';
  import CheckIcon from '@lucide/svelte/icons/check';
  import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
  import SparklesIcon from '@lucide/svelte/icons/sparkles';
  import { getQuestionTypeById } from '@cio/question-types';
  import { t } from '$lib/utils/functions/translations';
  import { snackbar } from '$features/ui/snackbar/store';
  import { courseApi } from '$features/course/api';
  import { triggerAttentionHighlight } from '$features/ui';
  import { publicConversionFlow } from '../../store/public-conversion.svelte';
  import { questionnaire, questionnaireMetaData } from '../exercise/store';
  import { getActiveExerciseQuestions } from '../../utils/exercise-progression-utils';
  import { getQuestionTypeId } from '../exercise/question-type-utils';
  import { getManualQuestionsFromList } from '../../utils/public-conversion-utils';

  interface Props {
    exerciseId: string;
    onJumpToQuestion?: (questionId: string | number) => void;
    onSave?: () => Promise<boolean | void> | boolean | void;
  }

  let { exerciseId, onJumpToQuestion, onSave }: Props = $props();

  let isConverting = $state(false);
  let isMovingNext = $state(false);

  const course = $derived(courseApi.course);
  const courseId = $derived(course?.id ?? '');

  const isStoreHydrated = $derived($questionnaireMetaData.exerciseId === exerciseId);

  const activeQuestions = $derived(isStoreHydrated ? getActiveExerciseQuestions($questionnaire.questions ?? []) : []);

  const currentExerciseManualQuestions = $derived(
    isStoreHydrated
      ? getManualQuestionsFromList(activeQuestions)
      : publicConversionFlow.offenders
          .filter((o) => o.exerciseId === exerciseId)
          .map((o) => ({ id: o.questionId, title: o.questionTitle, questionTypeId: o.typeId }))
  );

  const isCurrentExerciseResolved = $derived(
    isStoreHydrated
      ? currentExerciseManualQuestions.length === 0
      : publicConversionFlow.resolvedExerciseIds.has(exerciseId)
  );

  const countdown = $derived(
    publicConversionFlow.getCountdown(course, exerciseId, isStoreHydrated ? $questionnaire.questions : undefined)
  );

  const nextExercise = $derived(publicConversionFlow.getNextExercise(course, exerciseId));

  const CIRCUMFERENCE = 100.5;
  const strokeDashoffset = $derived(
    CIRCUMFERENCE - (CIRCUMFERENCE * Math.min(100, Math.max(0, countdown.percentComplete))) / 100
  );

  function scrollToQuestion(questionId: string | number) {
    onJumpToQuestion?.(questionId);

    const targetElementId = `exercise-question-${questionId}`;
    triggerAttentionHighlight(targetElementId);
  }

  async function handleNextExercise() {
    if (!nextExercise || !courseId || isMovingNext) return;

    if (onSave) {
      isMovingNext = true;
      try {
        const saved = await onSave();
        if (saved === false) {
          isMovingNext = false;
          return;
        }
      } catch (error) {
        console.error(error);
        isMovingNext = false;
        return;
      } finally {
        isMovingNext = false;
      }
    }

    const targetQuestionId = nextExercise.questions[0]?.questionId;
    const highlightQuery = targetQuestionId
      ? `?highlight=exercise-question-${targetQuestionId}&tab=questions`
      : '?tab=questions';
    goto(resolve(`/courses/${courseId}/exercises/${nextExercise.exerciseId}${highlightQuery}`, {}));
  }

  async function handleCompleteConversion() {
    if (!courseId || isConverting) return;

    if (onSave) {
      const saved = await onSave();
      if (saved === false) return;
    }

    isConverting = true;
    try {
      const response = await courseApi.update(courseId, { type: 'PUBLIC' });

      if (courseApi.success && response) {
        publicConversionFlow.reset();
        snackbar.success('snackbar.course_settings.success.converted_to_public');
        goto(resolve(`/courses/${courseId}/settings?highlight=course-type`, {}));
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
    goto(resolve(`/courses/${courseId}/settings?highlight=course-type`, {}));
  }
</script>

{#if publicConversionFlow.isActive && publicConversionFlow.courseId === courseId}
  <div
    class="ui:bg-background/90 ui:supports-[backdrop-filter]:bg-background/75 ui:z-app-bar sticky top-12 -mt-2 mb-2 w-full pt-3 pb-2 backdrop-blur-md"
  >
    <header
      class="flex w-full flex-col items-stretch gap-3.5 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3.5 shadow-xs sm:flex-row sm:items-center sm:gap-4 sm:px-6 sm:py-3.5 dark:border-amber-500/30 dark:bg-amber-950/20"
      role="region"
      aria-label={$t('course.navItem.settings.public_conversion.aria_label')}
    >
      <!-- Top row (Desktop + Mobile) -->
      <div class="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
        <!-- Back Link with Tooltip -->
        <Tooltip.Provider>
          <Tooltip.Root>
            <Tooltip.Trigger>
              {#snippet child({ props })}
                <Button
                  {...props}
                  variant="ghost"
                  size="icon-sm"
                  class="ui:text-muted-foreground ui:hover:text-foreground -ml-2.5 h-11! min-h-11! w-11! hover:bg-amber-500/15! sm:ml-0 sm:h-8! sm:min-h-8! sm:w-8! dark:hover:bg-amber-500/25!"
                  aria-label={$t('course.navItem.settings.public_conversion.back_to_settings')}
                  onclick={handleBackToSettings}
                >
                  <ArrowLeftIcon class="size-4.5 stroke-[2.4] sm:size-4" />
                </Button>
              {/snippet}
            </Tooltip.Trigger>
            <Tooltip.Content side="top" sideOffset={4}>
              <span>{$t('course.navItem.settings.public_conversion.back_to_settings')}</span>
            </Tooltip.Content>
          </Tooltip.Root>
        </Tooltip.Provider>

        <!-- Vertical Divider -->
        <div class="hidden h-7 w-px shrink-0 bg-amber-500/20 sm:block dark:bg-amber-500/30"></div>

        <!-- Circular Progress Ring -->
        <div class="relative flex size-9 shrink-0 items-center justify-center sm:size-10">
          <svg viewBox="0 0 36 36" class="size-9 -rotate-90 sm:size-10">
            <circle
              cx="18"
              cy="18"
              r="16"
              class="fill-none stroke-amber-500/25 dark:stroke-amber-500/30"
              stroke-width="3.5"
            />
            <circle
              cx="18"
              cy="18"
              r="16"
              class="fill-none stroke-amber-600 transition-[stroke-dashoffset] duration-500 ease-out dark:stroke-amber-500"
              stroke-width="3.5"
              stroke-linecap="round"
              stroke-dasharray="100.5"
              stroke-dashoffset={strokeDashoffset}
            />
          </svg>
          <div
            class="ui:text-foreground absolute inset-0 flex items-center justify-center text-[10.5px] font-extrabold"
          >
            {#if countdown.isFullyResolved}
              <CheckIcon class="size-3.5 stroke-3 text-emerald-600 dark:text-emerald-400" />
            {:else}
              {countdown.percentComplete}%
            {/if}
          </div>
        </div>

        <!-- Text Block -->
        <div class="min-w-0 flex-1">
          <p class="ui:text-foreground mb-0.5 truncate text-[14px] leading-snug font-bold sm:text-[13.5px]">
            {$t('course.navItem.settings.public_conversion.banner_title')}
          </p>
          <p class="ui:text-muted-foreground truncate text-[12.5px] leading-snug">
            {#if countdown.isFullyResolved}
              <strong class="font-bold text-emerald-600 dark:text-emerald-400"
                >{$t('course.navItem.settings.public_conversion.all_exercises_fixed', {
                  total: countdown.totalExercises
                })}</strong
              >
              · {$t('course.navItem.settings.public_conversion.ready_to_convert')}
            {:else if isCurrentExerciseResolved}
              <strong class="font-bold text-emerald-600 dark:text-emerald-400"
                >✓ {$t('course.navItem.settings.public_conversion.exercise_fixed')}</strong
              >
              {#if countdown.remainingQuestions > 0}
                {countdown.remainingQuestions === 1
                  ? $t('course.navItem.settings.public_conversion.questions_left_other_singular', {
                      count: countdown.remainingQuestions
                    })
                  : $t('course.navItem.settings.public_conversion.questions_left_other_plural', {
                      count: countdown.remainingQuestions
                    })}
              {/if}
            {:else}
              <strong class="ui:text-foreground font-bold"
                >{countdown.resolvedExercises}/{countdown.totalExercises}</strong
              >
              {countdown.remainingQuestions === 1
                ? $t('course.navItem.settings.public_conversion.questions_left_singular', {
                    count: countdown.remainingQuestions
                  })
                : $t('course.navItem.settings.public_conversion.questions_left_plural', {
                    count: countdown.remainingQuestions
                  })}
            {/if}
          </p>
        </div>
      </div>

      <!-- Actions Row -->
      <div class="flex w-full items-center gap-2.5 sm:w-auto sm:shrink-0 sm:gap-2">
        <!-- Jump to Dropdown -->
        {#if !isCurrentExerciseResolved && currentExerciseManualQuestions.length > 0}
          <DropdownMenu.Root>
            <DropdownMenu.Trigger>
              {#snippet child({ props })}
                <Button
                  {...props}
                  variant="ghost"
                  size="sm"
                  class="group ui:text-muted-foreground ui:hover:text-foreground ui:data-[state=open]:text-foreground! h-11! min-h-11! shrink-0 gap-1.5 px-4 text-[13.5px] font-bold hover:bg-amber-500/15! data-[state=open]:bg-amber-500/20! sm:h-8! sm:min-h-8! sm:px-3 sm:text-[13px] dark:hover:bg-amber-500/25! dark:data-[state=open]:bg-amber-500/30!"
                >
                  <span>{$t('course.navItem.settings.public_conversion.jump_to')}</span>
                  <ChevronDownIcon
                    class="size-3 stroke-[2.6] transition-transform duration-200 group-data-[state=open]:rotate-180"
                  />
                </Button>
              {/snippet}
            </DropdownMenu.Trigger>
            <DropdownMenu.Content align="end" class="max-h-60 w-64 overflow-y-auto p-1">
              {#each currentExerciseManualQuestions as q, index (q.id)}
                {@const typeId = getQuestionTypeId(q)}
                {@const questionTypeMeta = getQuestionTypeById(typeId)}
                <DropdownMenu.Item
                  class="flex cursor-pointer items-center justify-between gap-2 rounded px-2 py-1.5 text-xs"
                  onclick={() => scrollToQuestion(q.id)}
                >
                  <div class="flex min-w-0 flex-1 items-center gap-2">
                    <QuestionTypeIcon {typeId} class="ui:size-5 shrink-0 rounded text-[9px]" />
                    <span class="truncate font-medium"
                      >{q.title ||
                        $t('course.navItem.settings.public_conversion.question_fallback', { number: index + 1 })}</span
                    >
                  </div>
                  {#if questionTypeMeta?.label}
                    <Badge variant="outline" class="shrink-0 text-[10px] font-normal">
                      {questionTypeMeta.label}
                    </Badge>
                  {/if}
                </DropdownMenu.Item>
              {/each}
            </DropdownMenu.Content>
          </DropdownMenu.Root>
        {/if}

        <!-- CTA Button -->
        {#if countdown.isFullyResolved}
          <Button
            variant="default"
            size="sm"
            class="h-11! min-h-11! flex-1 gap-1.5 bg-emerald-600 px-3.5 text-[13.5px] font-bold text-white shadow-xs hover:bg-emerald-700 sm:h-8! sm:min-h-8! sm:flex-initial sm:text-[13px] dark:bg-emerald-600 dark:hover:bg-emerald-700"
            loading={isConverting}
            onclick={handleCompleteConversion}
          >
            <SparklesIcon class="size-3.5" />
            <span>{$t('course.navItem.settings.public_conversion.complete_conversion')}</span>
          </Button>
        {:else if nextExercise}
          <Button
            variant="secondary"
            size="sm"
            class="h-11! min-h-11! flex-1 gap-1.5 px-3.5 text-[13.5px] font-bold shadow-xs sm:h-8! sm:min-h-8! sm:flex-initial sm:text-[13px]"
            loading={isMovingNext}
            onclick={handleNextExercise}
          >
            <span class="truncate max-[380px]:hidden"
              >{$t('course.navItem.settings.public_conversion.next_exercise', {
                exercise: nextExercise.exerciseTitle
              })}</span
            >
            <span class="hidden max-[380px]:inline">{$t('course.navItem.settings.public_conversion.next')}</span>
            <ArrowRightIcon class="size-3 stroke-[2.6]" />
          </Button>
        {/if}
      </div>
    </header>
  </div>
{/if}
