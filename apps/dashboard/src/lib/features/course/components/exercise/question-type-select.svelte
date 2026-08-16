<script lang="ts">
  import * as Select from '@cio/ui/base/select';
  import { PREMIUM_QUESTION_TYPE_KEYS, QUESTION_TYPES } from '$features/ui/question/constants';
  import { PremiumIcon } from '@cio/ui/custom/moving-icons';
  import { getExerciseEditorQuestionTypeLabel } from './question-type-utils';
  import { isFreePlan } from '$lib/utils/store/org';
  import { openUpgradeModal } from '$lib/utils/store/upgrade-modal';
  import { t } from '$lib/utils/functions/translations';
  import { onDestroy } from 'svelte';
  import type { Question } from '$features/course/types';

  type QuestionTypeEntry = (typeof QUESTION_TYPES)[number];

  interface Props {
    value: string | undefined;
    onValueChange: (value: string) => void;
    triggerQuestionType: Question['questionType'] | undefined;
    types: QuestionTypeEntry[];
  }

  let { value, onValueChange, triggerQuestionType, types }: Props = $props();

  const SELECT_CLOSE_ANIMATION_MS = 180;

  let isSelectOpen = $state(false);
  let openUpgradeModalTimeout: ReturnType<typeof setTimeout> | undefined;

  const autoGradableTypes = $derived(types.filter((typeEntry) => typeEntry.autoGradable));
  const manuallyGradedTypes = $derived(types.filter((typeEntry) => !typeEntry.autoGradable));

  function handlePremiumTypeClick(clickEvent: MouseEvent) {
    clickEvent.preventDefault();
    clickEvent.stopPropagation();

    isSelectOpen = false;
    clearTimeout(openUpgradeModalTimeout);
    openUpgradeModalTimeout = setTimeout(() => {
      openUpgradeModal();
    }, SELECT_CLOSE_ANIMATION_MS);
  }

  onDestroy(() => {
    clearTimeout(openUpgradeModalTimeout);
  });
</script>

{#snippet sectionTitle({ title, description })}
  <div>
    <Select.Label>
      <p class="font-semibold">
        {$t(title)}
      </p>
      <p class="ui:text-muted-foreground ui:mt-1 ui:text-xs">
        {$t(description)}
      </p>
    </Select.Label>
  </div>
{/snippet}

{#snippet upgradeButton({ typeEntry })}
  <button
    type="button"
    class="ui:relative ui:flex ui:w-full ui:cursor-pointer ui:select-none ui:items-center ui:justify-between ui:gap-2 ui:rounded-sm ui:px-2 ui:py-1.5 ui:text-sm ui:outline-hidden ui:hover:bg-accent ui:hover:text-accent-foreground"
    onclick={handlePremiumTypeClick}
    title={$t('course.navItem.lessons.exercises.all_exercises.edit_mode.premium_question_type')}
  >
    <span>{getExerciseEditorQuestionTypeLabel(typeEntry)}</span>
    <PremiumIcon size={16} class="ui:ml-auto ui:shrink-0 ui:text-blue-700 ui:dark:text-white" />
  </button>
{/snippet}

<Select.Root type="single" {value} {onValueChange} bind:open={isSelectOpen}>
  <Select.Trigger class="w-full min-w-0 sm:w-[180px]">
    {getExerciseEditorQuestionTypeLabel(triggerQuestionType)}
  </Select.Trigger>
  <Select.Content class="max-h-[300px]!">
    <Select.Group>
      {@render sectionTitle({
        title: 'course.navItem.lessons.exercises.all_exercises.edit_mode.question_type_auto_gradable',
        description: 'course.navItem.lessons.exercises.all_exercises.edit_mode.question_type_auto_gradable_description'
      })}

      {#each autoGradableTypes as typeEntry (typeEntry.key)}
        {#if $isFreePlan && PREMIUM_QUESTION_TYPE_KEYS.has(typeEntry.key)}
          {@render upgradeButton({ typeEntry })}
        {:else}
          <Select.Item value={typeEntry.id.toString()} label={getExerciseEditorQuestionTypeLabel(typeEntry)}>
            {getExerciseEditorQuestionTypeLabel(typeEntry)}
          </Select.Item>
        {/if}
      {/each}
    </Select.Group>

    {#if manuallyGradedTypes.length > 0}
      <Select.Separator />

      <Select.Group>
        {@render sectionTitle({
          title: 'course.navItem.lessons.exercises.all_exercises.edit_mode.question_type_manual_grading',
          description:
            'course.navItem.lessons.exercises.all_exercises.edit_mode.question_type_manual_grading_description'
        })}

        {#each manuallyGradedTypes as typeEntry (typeEntry.key)}
          {#if $isFreePlan && PREMIUM_QUESTION_TYPE_KEYS.has(typeEntry.key)}
            {@render upgradeButton({ typeEntry })}
          {:else}
            <Select.Item value={typeEntry.id.toString()} label={getExerciseEditorQuestionTypeLabel(typeEntry)}>
              {getExerciseEditorQuestionTypeLabel(typeEntry)}
            </Select.Item>
          {/if}
        {/each}
      </Select.Group>
    {/if}
  </Select.Content>
</Select.Root>
