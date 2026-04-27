<script lang="ts">
  import { Button } from '@cio/ui/base/button';
  import { TextareaField } from '@cio/ui/custom/textarea-field';
  import { t } from '$lib/utils/functions/translations';
  import type { WidgetDetail } from '../utils/types';

  interface Props {
    detail: WidgetDetail;
    onRollback: (versionId: string) => void;
    onDelete: () => void;
  }

  let { detail, onRollback, onDelete }: Props = $props();
</script>

<div class="space-y-6">
  <TextareaField label={$t('widgets.form.embed_code')} value={detail.widget.embedCode} rows={6} readonly />
  <div class="flex flex-wrap gap-2">
    <Button variant="outline" onclick={() => navigator.clipboard.writeText(detail.widget.embedCode)}>
      {$t('widgets.actions.copy_embed')}
    </Button>
  </div>

  {#if detail.versions.length > 0}
    <div class="space-y-2">
      <h3 class="text-sm font-semibold">{$t('widgets.editor.version_history')}</h3>
      {#each detail.versions as version (version.id)}
        <div class="ui:border-border ui:bg-card/50 flex items-center justify-between rounded-2xl border p-3">
          <div>
            <div class="font-medium">v{version.version}</div>
            <div class="ui:text-muted-foreground text-xs">{version.publishedAt}</div>
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
