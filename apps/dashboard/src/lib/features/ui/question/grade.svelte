<script lang="ts">
  import { NumberField } from '@cio/ui/custom/number-field';
  import { t } from '$lib/utils/functions/translations';

  interface Props {
    gradeMax?: number;
    disableGrading?: boolean;
    grade?: number | null;
  }

  let { gradeMax = 0, disableGrading = false, grade = $bindable() }: Props = $props();

  const score = $derived(typeof grade === 'number' ? grade : 0);

  function updateScore(next: number | null) {
    grade = next ?? 0;
  }
</script>

<div class="flex items-center">
  <NumberField
    placeholder={$t('course.navItem.lessons.exercises.new_exercise_modal.points')}
    integer
    min={0}
    max={gradeMax}
    value={score}
    onValueChange={updateScore}
    isDisabled={disableGrading}
    inputClassName="!w-16"
  />

  <p class="ml-2 flex items-center text-base dark:text-white">
    <span class="mr-1">/</span> <span>{gradeMax}</span>
  </p>
</div>
