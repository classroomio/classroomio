<script lang="ts">
  import { Badge } from '@cio/ui/base/badge';
  import { t } from '$lib/utils/functions/translations';

  interface Props {
    isPublished?: boolean;
    isPrivate?: boolean;
  }

  let { isPublished = false, isPrivate = false }: Props = $props();
</script>

<Badge variant={isPublished ? 'default' : 'outline'}>
  {#if isPublished}
    {$t('courses.course_card.published')}
  {:else}
    {$t('courses.course_card.unpublished')}
  {/if}
</Badge>
{#if isPrivate}
  <Badge variant="secondary">{$t('course.navItem.settings.private.badge')}</Badge>
{/if}
