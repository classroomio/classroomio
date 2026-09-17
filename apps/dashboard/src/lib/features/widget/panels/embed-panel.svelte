<script lang="ts">
  import { browser, dev } from '$app/environment';
  import { Button } from '@cio/ui/base/button';
  import { CopyButton } from '@cio/ui/base/copy-button';
  import * as Tabs from '@cio/ui/base/tabs';
  import { TextareaField } from '@cio/ui/custom/textarea-field';
  import { t } from '$lib/utils/functions/translations';
  import { isOrgAdmin } from '$lib/utils/store/org';
  import WidgetVersionHistory from '../components/widget-version-history.svelte';
  import type { WidgetDetail } from '../utils/types';
  import { adaptDevWidgetEmbedCode, adaptDevWidgetUrl } from '@cio/utils/constants';

  interface Props {
    detail: WidgetDetail;
    onRollback: (versionId: string) => void;
    onArchive: () => void;
  }

  let { detail, onRollback, onArchive }: Props = $props();

  let activeFormat = $state<'html' | 'url'>('html');

  const locationInfo = $derived(
    browser && dev ? { hostname: window.location.hostname, protocol: window.location.protocol } : undefined
  );

  const displayEmbedCode = $derived(adaptDevWidgetEmbedCode(detail.widget.embedCode, locationInfo));
  const displayHostedEmbedUrl = $derived(adaptDevWidgetUrl(detail.widget.hostedEmbedUrl, locationInfo));
</script>

<div class="space-y-6">
  <Tabs.Root bind:value={activeFormat} class="w-full">
    <Tabs.List class="inline-flex w-auto">
      <Tabs.Trigger value="html">{$t('widgets.embed.tabs.html')}</Tabs.Trigger>
      <Tabs.Trigger value="url">{$t('widgets.embed.tabs.url')}</Tabs.Trigger>
    </Tabs.List>

    <Tabs.Content value="html" class="mt-4 space-y-3">
      <TextareaField label={$t('widgets.form.embed_code')} value={displayEmbedCode} rows={6} readonly />
      <div class="flex flex-wrap gap-2">
        <CopyButton text={displayEmbedCode} variant="outline">
          {$t('widgets.actions.copy_embed')}
        </CopyButton>
      </div>
    </Tabs.Content>

    <Tabs.Content value="url" class="mt-4 space-y-3">
      <TextareaField label={$t('widgets.embed.url_label')} value={displayHostedEmbedUrl} rows={2} readonly />
      <p class="ui:text-muted-foreground text-xs">{$t('widgets.embed.url_helper')}</p>
      <div class="flex flex-wrap gap-2">
        <CopyButton text={displayHostedEmbedUrl} variant="outline">
          {$t('widgets.actions.copy_url')}
        </CopyButton>
      </div>
    </Tabs.Content>
  </Tabs.Root>

  <WidgetVersionHistory {detail} {onRollback} />

  {#if $isOrgAdmin}
    <div class="ui:border-border border-t pt-4">
      <Button variant="outline" class="w-full" onclick={onArchive}>
        {$t('widgets.actions.archive')}
      </Button>
    </div>
  {/if}
</div>
