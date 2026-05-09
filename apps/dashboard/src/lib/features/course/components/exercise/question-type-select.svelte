<script lang="ts">
  import * as Select from '@cio/ui/base/select';
  import { Badge } from '@cio/ui/base/badge';
  import { PREMIUM_QUESTION_TYPE_KEYS, QUESTION_TYPES } from '$features/ui/question/constants';
  import { PremiumIcon } from '@cio/ui/custom/moving-icons';
  import { getExerciseEditorQuestionTypeLabel } from './question-type-utils';
  import { isFreePlan } from '$lib/utils/store/org';
  import { openUpgradeModal } from '$lib/utils/functions/org';
  import { t } from '$lib/utils/functions/translations';
  import type { Question } from '$features/course/types';

  type QuestionTypeEntry = (typeof QUESTION_TYPES)[number];

  interface Props {
    value: string | undefined;
    onValueChange: (value: string) => void;
    triggerQuestionType: Question['questionType'] | undefined;
    types: QuestionTypeEntry[];
    selfPacedCourse?: boolean;
  }

  let { value, onValueChange, triggerQuestionType, types, selfPacedCourse = false }: Props = $props();
</script>

<Select.Root type="single" {value} {onValueChange}>
  <Select.Trigger class="w-full min-w-0 sm:w-[180px]">
    {getExerciseEditorQuestionTypeLabel(triggerQuestionType)}
  </Select.Trigger>
  <Select.Content>
    {#each types as typeEntry (typeEntry.key)}
      {#if $isFreePlan && PREMIUM_QUESTION_TYPE_KEYS.has(typeEntry.key)}
        <button
          type="button"
          class="ui:flex ui:w-full ui:cursor-pointer ui:select-none ui:items-center ui:gap-2 ui:rounded-sm ui:py-1.5 ui:pl-2 ui:pr-8 ui:text-sm ui:outline-hidden ui:hover:bg-accent ui:hover:text-accent-foreground ui:relative"
          onclick={(clickEvent) => {
            clickEvent.preventDefault();
            clickEvent.stopPropagation();
            openUpgradeModal();
          }}
          title={$t('course.navItem.lessons.exercises.all_exercises.edit_mode.premium_question_type')}
        >
          <PremiumIcon size={16} class="ui:text-blue-700 ui:dark:text-white ui:shrink-0" />
          <span>{getExerciseEditorQuestionTypeLabel(typeEntry)}</span>
        </button>
      {:else}
        <Select.Item value={typeEntry.id.toString()} label={getExerciseEditorQuestionTypeLabel(typeEntry)}>
          {#snippet children({ selected: _sel })}
            <span class="flex w-full min-w-0 items-center justify-between gap-2">
              <span class="truncate">{getExerciseEditorQuestionTypeLabel(typeEntry)}</span>
              {#if selfPacedCourse}
                <Badge
                  variant={typeEntry.autoGradable ? 'success' : 'warning'}
                  class="ui:shrink-0 ui:text-[10px] ui:font-normal"
                >
                  {typeEntry.autoGradable
                    ? $t('course.navItem.lessons.exercises.all_exercises.edit_mode.question_type_auto_gradable')
                    : $t('course.navItem.lessons.exercises.all_exercises.edit_mode.question_type_manual_grading')}
                </Badge>
              {/if}
            </span>
          {/snippet}
        </Select.Item>
      {/if}
    {/each}
  </Select.Content>
</Select.Root>
