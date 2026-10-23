<script lang="ts">
  import * as Select from '@cio/ui/base/select';
  import { t } from '$lib/utils/functions/translations';

  import type { InsightsStructureItem } from '../utils/types';
  import PassRequiredTag from './pass-required-tag.svelte';

  interface Props {
    exercises: InsightsStructureItem[];
    value: string | null;
    onChange: (exerciseId: string) => void;
  }

  let { exercises, value, onChange }: Props = $props();

  const selectedValue = $derived(value ?? exercises[0]?.id ?? '');
  const selectedExercise = $derived(exercises.find((exercise) => exercise.id === selectedValue));

  function handleChange(next: string) {
    onChange(next);
  }
</script>

<Select.Root type="single" value={selectedValue} onValueChange={handleChange}>
  <Select.Trigger
    class="w-full sm:w-[260px]"
    aria-label={$t('insights.exercise_picker')}
    data-testid="insights-exercise-picker"
  >
    <span class="truncate">{selectedExercise?.title ?? ''}</span>
  </Select.Trigger>
  <Select.Content>
    {#each exercises as exercise (exercise.id)}
      <Select.Item value={exercise.id} label={exercise.title}>
        <div class="flex w-full items-center justify-between gap-2">
          <span class="truncate">{exercise.title}</span>
          {#if exercise.isPassRequired && exercise.passMark !== null}
            <PassRequiredTag passMark={exercise.passMark} />
          {/if}
        </div>
      </Select.Item>
    {/each}
  </Select.Content>
</Select.Root>
