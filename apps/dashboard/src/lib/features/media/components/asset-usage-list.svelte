<script lang="ts">
  import { Button } from '@cio/ui/base/button';
  import ExternalLinkIcon from '@lucide/svelte/icons/external-link';

  import { resolve } from '$app/paths';
  import { t } from '$lib/utils/functions/translations';
  import { formatUsageDate, getSlotTypeLabel, getTargetTypeLabel, type AssetUsageGraph } from '$features/media/utils';

  interface Props {
    usages: AssetUsageGraph['usages'];
    onNavigate?: () => void;
  }

  let { usages, onNavigate = () => {} }: Props = $props();

  function lessonHref(courseId: string, lessonId: string) {
    return resolve(`/courses/${courseId}/lessons/${lessonId}`, {});
  }
</script>

<div class="max-h-[420px] overflow-auto rounded-lg border">
  <div class="divide-y">
    {#each usages as usage (usage.id)}
      <div class="flex flex-col gap-2 p-3 text-sm md:flex-row md:items-center md:justify-between md:gap-4">
        <div class="min-w-0 flex-1">
          <p class="truncate font-medium">
            {usage.targetTitle ?? getTargetTypeLabel(usage.targetType)}
          </p>
          <p class="ui:text-muted-foreground mt-0.5 truncate text-xs">
            {#if usage.courseTitle}
              {usage.courseTitle} ·
            {/if}
            {getSlotTypeLabel(usage.slotType)}{usage.slotKey ? ` (${usage.slotKey})` : ''} ·
            {$t('media_manager.usage.table.added')}
            {formatUsageDate(usage.createdAt)}
          </p>
        </div>

        {#if usage.targetType === 'lesson' && usage.courseId}
          <Button
            variant="outline"
            size="sm"
            class="shrink-0"
            href={lessonHref(usage.courseId!, usage.targetId)}
            onclick={() => onNavigate()}
          >
            <ExternalLinkIcon size={14} class="mr-1.5" />
            {$t('media_manager.usage.go_to_lesson')}
          </Button>
        {/if}
      </div>
    {/each}
  </div>
</div>
