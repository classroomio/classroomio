<script lang="ts">
  import { t } from '$lib/utils/functions/translations';
  let { label = $t('course.navItem.lessons.exercises.new_exercise_modal.coming_soon') } = $props();
</script>

<p
  class="org-avatar bg-primary-200 text-primary-700 rounded-md px-2 py-1 text-center text-xs font-medium"
>
  {label}
</p>

<style>
  .org-avatar {
    width: fit-content;
  }
</style>
