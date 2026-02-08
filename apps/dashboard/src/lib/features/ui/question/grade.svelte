<script lang="ts">
  import { InputField } from '@cio/ui/custom/input-field';
  import { t } from '$lib/utils/functions/translations';
  import { snackbar } from '$features/ui/snackbar/store';

  interface Props {
    gradeMax?: number;
    disableGrading?: boolean;
    grade?: number | undefined;
  }

  let { gradeMax = 0, disableGrading = false, grade = $bindable(0) }: Props = $props();

  $effect(() => {
    if (grade && grade > gradeMax) {
      snackbar.error('grade cant be more than max value');
      grade = gradeMax;
    }
  });
</script>

<div class="flex items-center">
  <InputField
    placeholder={$t('course.navItem.lessons.exercises.new_exercise_modal.points')}
    bind:value={grade}
    max={gradeMax}
    type="number"
    inputClassName="!w-14"
    isDisabled={disableGrading}
  />

  <p class="ml-2 flex items-center text-base dark:text-white">
    <span class="mr-1">/</span> <span>{gradeMax}</span>
  </p>
</div>
