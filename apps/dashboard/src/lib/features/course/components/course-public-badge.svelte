<script lang="ts">
  import { Badge } from '@cio/ui/base/badge';
  import GlobeIcon from '@lucide/svelte/icons/globe';
  import { t } from '$lib/utils/functions/translations';

  interface Props {
    class?: string;
  }

  let { class: className = '' }: Props = $props();
</script>

<Badge variant="secondary" class="inline-flex shrink-0 items-center gap-1 rounded-md! text-xs capitalize {className}">
  <GlobeIcon class="size-3.5 shrink-0" />
  {$t('courses.course_card.public_badge')}
</Badge>
