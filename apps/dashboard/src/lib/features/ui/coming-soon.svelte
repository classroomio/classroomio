<script lang="ts">
  import { Badge } from '@cio/ui/base/badge';
  import { t } from '$lib/utils/functions/translations';

  let { label = $t('course.navItem.lessons.exercises.new_exercise_modal.coming_soon') } = $props();
</script>

<Badge variant="default" class="">
  {label}
</Badge>
