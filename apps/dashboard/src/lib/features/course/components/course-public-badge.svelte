<script lang="ts">
  import { Badge } from '@cio/ui/base/badge';
  import GlobeIcon from '@lucide/svelte/icons/globe';
  import { t } from '$lib/utils/functions/translations';

  interface Props {
    class?: string;
  }

  let { class: className = '' }: Props = $props();
</script>

<Badge
  variant="secondary"
  class="ui:inline-flex ui:shrink-0 ui:items-center ui:gap-1 ui:rounded-md! ui:text-xs ui:capitalize {className}"
>
  <GlobeIcon class="size-3.5 shrink-0" />
  {$t('courses.course_card.public_badge')}
</Badge>
