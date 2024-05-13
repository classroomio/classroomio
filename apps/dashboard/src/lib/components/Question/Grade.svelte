<script lang="ts">
  import TextField from '$lib/components/Form/TextField.svelte';
  import { t } from '$lib/utils/functions/translations';
  import { snackbar } from '../Snackbar/store';

  export let gradeMax = 0;
  export let disableGrading = false;
  export let grade: number | undefined = 0;

  $: if (grade && grade > gradeMax) {
    snackbar.error('grade cant be more than max value');
    grade = gradeMax;
  }
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

  <p class="dark:text-white ml-2 text-base flex items-center font-semibold">
    <span class="mr-1">/</span> <span>{gradeMax}</span>
  </p>
</div>
