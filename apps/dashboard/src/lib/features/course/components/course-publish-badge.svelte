<script lang="ts">
  import { Badge } from '@cio/ui/base/badge';
  import { t } from '$lib/utils/functions/translations';

  interface Props {
    isPublished?: boolean;
  }

  let { isPublished = false }: Props = $props();
</script>

<Badge variant={isPublished ? 'default' : 'outline'}>
  {#if isPublished}
    {$t('courses.course_card.published')}
  {:else}
    {$t('courses.course_card.unpublished')}
  {/if}
</Badge>
