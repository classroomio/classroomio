<script lang="ts">
  import TextField from '$lib/components/Form/TextField.svelte';
  import { t } from '$lib/utils/functions/translations';
  import { snackbar } from '../Snackbar/store';

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

<div class="flex items-center font-semibold">
  <TextField
    placeholder={$t('course.navItem.lessons.exercises.new_exercise_modal.points')}
    bind:value={grade}
    max={gradeMax}
    type="number"
    className="w-12"
    inputClassName="h-10"
    isDisabled={disableGrading}
  />

  <p class="ml-2 flex items-center text-base font-semibold dark:text-white">
    <span class="mr-1">/</span> <span>{gradeMax}</span>
  </p>
</div>
