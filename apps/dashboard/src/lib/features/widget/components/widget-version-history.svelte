<script lang="ts">
  import { Badge } from '@cio/ui/base/badge';
  import { Button } from '@cio/ui/base/button';
  import * as Tooltip from '@cio/ui/base/tooltip';
  import InfoIcon from '@lucide/svelte/icons/info';
  import { t } from '$lib/utils/functions/translations';
  import type { WidgetDetail } from '../utils/types';

  interface Props {
    detail: WidgetDetail;
    onRollback: (versionId: string) => void;
  }

  let { detail, onRollback }: Props = $props();

  const currentVersion = $derived(
    detail.versions.find((version) => version.id === detail.widget.latestPublishedVersionId)
  );
</script>

{#if detail.versions.length > 0}
  <div class="space-y-4">
    <div>
      <h3 class="text-sm font-semibold">{$t('widgets.editor.version_history')}</h3>
      {#if currentVersion}
        <p class="ui:text-muted-foreground text-xs">
          {$t('widgets.editor.current_version')}: v{currentVersion.version}
        </p>
      {/if}
    </div>
    {#each detail.versions as version (version.id)}
      {@const isActive = version.id === detail.widget.latestPublishedVersionId}
      <div class="ui:border-border ui:bg-card/50 relative flex items-center justify-between rounded-2xl border p-3">
        {#if isActive}
          <Tooltip.Provider>
            <Tooltip.Root>
              <Tooltip.Trigger>
                {#snippet child({ props })}
                  <Badge
                    {...props}
                    variant="outline"
                    class="absolute top-0 right-4 z-10 translate-y-[-50%] gap-1 border-green-100! bg-green-100! font-normal text-green-700! dark:bg-green-950! dark:text-green-300!"
                  >
                    {$t('widgets.editor.active_badge')}
                    <InfoIcon class="h-3 w-3 text-green-700! dark:text-green-300" aria-hidden="true" />
                  </Badge>
                {/snippet}
              </Tooltip.Trigger>
              <Tooltip.Content side="top" sideOffset={6} class="max-w-xs">
                {$t('widgets.editor.active_badge_description')}
              </Tooltip.Content>
            </Tooltip.Root>
          </Tooltip.Provider>
        {/if}
        <div>
          <div class="font-medium">v{version.version}</div>
          <div class="ui:text-muted-foreground text-xs">
            {new Date(version.publishedAt).toLocaleString(undefined, {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit'
            })}
          </div>
        </div>
        {#if !isActive}
          <Button variant="outline" size="sm" onclick={() => onRollback(version.id)}>
            {$t('widgets.actions.restore')}
          </Button>
        {/if}
      </div>
    {/each}
  </div>
{/if}
