<script lang="ts">
  import { Button } from '@cio/ui/base/button';
  import { CopyButton } from '@cio/ui/base/copy-button';
  import * as Tabs from '@cio/ui/base/tabs';
  import * as Tooltip from '@cio/ui/base/tooltip';
  import { Badge } from '@cio/ui/base/badge';
  import InfoIcon from '@lucide/svelte/icons/info';
  import { TextareaField } from '@cio/ui/custom/textarea-field';
  import { t } from '$lib/utils/functions/translations';
  import type { WidgetDetail } from '../utils/types';

  interface Props {
    detail: WidgetDetail;
    onRollback: (versionId: string) => void;
    onDelete: () => void;
  }

  let { detail, onRollback, onDelete }: Props = $props();

  let activeFormat = $state<'html' | 'url'>('html');

  const currentVersion = $derived(detail.versions.find((v) => v.id === detail.widget.latestPublishedVersionId));
</script>

<div class="space-y-6">
  <Tabs.Root bind:value={activeFormat} class="w-full">
    <Tabs.List class="inline-flex w-auto">
      <Tabs.Trigger value="html">{$t('widgets.embed.tabs.html')}</Tabs.Trigger>
      <Tabs.Trigger value="url">{$t('widgets.embed.tabs.url')}</Tabs.Trigger>
    </Tabs.List>

    <Tabs.Content value="html" class="mt-4 space-y-3">
      <TextareaField label={$t('widgets.form.embed_code')} value={detail.widget.embedCode} rows={6} readonly />
      <div class="flex flex-wrap gap-2">
        <CopyButton text={detail.widget.embedCode} variant="outline">
          {$t('widgets.actions.copy_embed')}
        </CopyButton>
      </div>
    </Tabs.Content>

    <Tabs.Content value="url" class="mt-4 space-y-3">
      <TextareaField label={$t('widgets.embed.url_label')} value={detail.widget.hostedEmbedUrl} rows={2} readonly />
      <p class="ui:text-muted-foreground text-xs">{$t('widgets.embed.url_helper')}</p>
      <div class="flex flex-wrap gap-2">
        <CopyButton text={detail.widget.hostedEmbedUrl} variant="outline">
          {$t('widgets.actions.copy_url')}
        </CopyButton>
      </div>
    </Tabs.Content>
  </Tabs.Root>

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

  <div class="ui:border-border border-t pt-4">
    <Button variant="outline" class="w-full" onclick={onDelete}>
      {$t('widgets.actions.archive')}
    </Button>
  </div>
</div>
