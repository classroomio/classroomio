<script lang="ts">
  import { Badge } from '@cio/ui/base/badge';
  import * as Sheet from '@cio/ui/base/sheet';
  import { Empty } from '@cio/ui/custom/empty';
  import ZapIcon from '@lucide/svelte/icons/zap';

  import type { ZapierConnection } from '$features/automation/utils/types';
  import { formatZapierDate, getZapierTriggerKey } from '$features/automation/utils/zapier-utils';
  import { t } from '$lib/utils/functions/translations';

  const T = 'automation.zapier.triggers';

  interface Props {
    connection: ZapierConnection | null;
    onClose: () => void;
  }

  let { connection, onClose }: Props = $props();

  function handleOpenChange(isOpen: boolean) {
    if (!isOpen) onClose();
  }
</script>

<Sheet.Root open={connection !== null} onOpenChange={handleOpenChange}>
  <Sheet.Content class="w-full overflow-y-auto sm:max-w-lg" data-testid="zapier-triggers-sheet">
    <Sheet.Header>
      <Sheet.Title>{$t(`${T}.title`)}</Sheet.Title>
      <Sheet.Description>{$t(`${T}.description`)}</Sheet.Description>
    </Sheet.Header>

    <div class="space-y-3 px-4 pb-6">
      {#if connection && connection.triggers.length === 0}
        <Empty title={$t(`${T}.empty_title`)} description={$t(`${T}.empty_description`)} icon={ZapIcon} />
      {:else if connection}
        {#each connection.triggers as trigger (trigger.id)}
          {@const triggerKey = getZapierTriggerKey(trigger.eventType)}
          <div class="ui:border-border space-y-1 rounded-lg border p-3">
            <div class="flex items-center justify-between gap-3">
              <p class="font-medium">
                {triggerKey ? $t(`automation.zapier.catalog_triggers.${triggerKey}.label`) : trigger.eventType}
              </p>
              <Badge variant={trigger.health === 'healthy' ? 'secondary' : 'destructive'}>
                {$t(`${T}.health_${trigger.health}`)}
              </Badge>
            </div>
            {#if trigger.courseTitle}
              <p class="ui:text-muted-foreground text-sm">
                {$t(`${T}.course_filter`, { course: trigger.courseTitle })}
              </p>
            {/if}
            {#if trigger.cohortTitle}
              <p class="ui:text-muted-foreground text-sm">
                {$t(`${T}.cohort_filter`, { cohort: trigger.cohortTitle })}
              </p>
            {/if}
            <p class="ui:text-muted-foreground text-xs">
              {trigger.lastDeliveryAt
                ? $t(`${T}.last_delivery`, { date: formatZapierDate(trigger.lastDeliveryAt) ?? '' })
                : $t(`${T}.no_deliveries`)}
            </p>
            <p class="ui:text-muted-foreground text-xs">
              {$t(`${T}.created_at`, { date: formatZapierDate(trigger.createdAt) ?? '' })}
            </p>
          </div>
        {/each}
      {/if}
    </div>
  </Sheet.Content>
</Sheet.Root>
