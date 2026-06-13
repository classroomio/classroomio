<script lang="ts">
  import { Button } from '@cio/ui/base/button';
  import { CopyButton } from '@cio/ui/base/copy-button';
  import * as Tabs from '@cio/ui/base/tabs';
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
    <div class="space-y-2">
      <h3 class="text-sm font-semibold">{$t('widgets.editor.version_history')}</h3>
      {#each detail.versions as version (version.id)}
        <div class="ui:border-border ui:bg-card/50 flex items-center justify-between rounded-2xl border p-3">
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
          <Button variant="outline" size="sm" onclick={() => onRollback(version.id)}>
            {$t('widgets.actions.restore')}
          </Button>
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
