<script lang="ts">
  import { Badge } from '@cio/ui/base/badge';
  import { t } from '$lib/utils/functions/translations';

  let { label = $t('course.navItem.lessons.exercises.new_exercise_modal.coming_soon') } = $props();
</script>

<Badge variant="outline" class="ui:text-white bg-blue-500 dark:bg-blue-600 dark:text-black">
  {label}
</Badge>
