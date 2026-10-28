<script lang="ts">
  import * as Tooltip from '@cio/ui/base/tooltip';
  import { t } from '$lib/utils/functions/translations';
</script>

<Tooltip.Provider>
  <Tooltip.Root>
    <Tooltip.Trigger class="ui:bg-muted ui:text-muted-foreground rounded-full px-2 py-0.5 text-[11px] font-medium">
      {$t('insights.now_tag.label')}
    </Tooltip.Trigger>
    <Tooltip.Content side="top" sideOffset={4} class="max-w-xs">{$t('insights.now_tag.hint')}</Tooltip.Content>
  </Tooltip.Root>
</Tooltip.Provider>
