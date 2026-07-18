<script lang="ts">
  import SparklesIcon from '@lucide/svelte/icons/sparkles';
  import XIcon from '@lucide/svelte/icons/x';
  import { IconButton } from '@cio/ui/custom/icon-button';
  import { Empty } from '@cio/ui/custom/empty';
  import { sidePanel } from '$features/side-panel';
  import { t } from '$lib/utils/functions/translations';

  interface Props {
    noteId?: string;
    noteTitle?: string;
  }

  let { noteId, noteTitle }: Props = $props();
</script>

<header class="border-border flex items-center gap-2 border-b px-4 py-3">
  <SparklesIcon size={16} class="ui:text-primary shrink-0" />
  <div class="min-w-0 flex-1">
    <p class="truncate text-sm font-semibold">{$t('notes.ai_panel.title')}</p>
    {#if noteTitle}
      <p class="ui:text-muted-foreground truncate text-xs">{noteTitle}</p>
    {/if}
  </div>
  <IconButton variant="secondary" size="icon" onclick={() => sidePanel.close()}>
    <XIcon size={16} />
  </IconButton>
</header>

<div class="flex min-h-0 flex-1 flex-col overflow-hidden p-4">
  <Empty
    title={$t('notes.ai_panel.empty_title')}
    description={$t('notes.ai_panel.empty_description')}
    icon={SparklesIcon}
  />
  {#if noteId}
    <p class="ui:text-muted-foreground mt-4 text-center text-xs">{$t('notes.ai_panel.note_context')}</p>
  {/if}
</div>
