<script lang="ts">
  import TextField from '$lib/components/Form/TextField.svelte';
  import { t } from '$lib/utils/functions/translations';
  import { snackbar } from '../Snackbar/store';

  export let gradeMax = 0;
  export let disableGrading = false;
  export let grade: number | undefined = 0;

  let error = '';

  $: {
    if (grade && grade > gradeMax) {
      snackbar.error('grade cant be more than max value');
      grade = 0;
    }
  }
</script>

{#if typeof grade !== 'undefined'}
  <div class="flex items-center font-semibold">
    <TextField
      placeholder={$t('course.navItem.lessons.exercises.new_exercise_modal.points')}
      bind:value={grade}
      type="number"
      className="w-10"
      inputClassName="h-10"
      isDisabled={disableGrading}
    />

    <p class="dark:text-white ml-2 text-base flex items-center font-semibold">
      <span class="mr-1">/</span> <span>{gradeMax}</span>
    </p>
  </div>
{/if}
