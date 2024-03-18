<script lang="ts">
  import TextField from '$lib/components/Form/TextField.svelte';
  import { t } from '$lib/utils/functions/translations';

  export let gradeMax = 0;
  export let disableGrading = false;
  export let grade: number | undefined;
</script>

{#if typeof grade !== 'undefined'}
  <div class="flex items-center">
    <TextField
      placeholder={$t('course.navItem.lessons.exercises.new_exercise_modal.points')}
      bind:value={grade}
      type="number"
      className="w-12"
      isDisabled={disableGrading}
    />
    <p class="dark:text-white ml-2 text-lg flex items-center">
      <span class="mr-1">/</span> <span>{gradeMax}</span>
    </p>
  </div>
{/if}
