<script lang="ts">
  import MessageSquareIcon from '@lucide/svelte/icons/message-square';
  import { Button } from '@cio/ui/base/button';
  import { t } from '$lib/utils/functions/translations';

  interface Props {
    canWrite?: boolean;
  }

  let { canWrite = true }: Props = $props();
</script>

<section class="border-border border-b py-3">
  <div class="flex items-center justify-between gap-3">
    <div class="flex items-center gap-2">
      <MessageSquareIcon size={16} class="ui:text-muted-foreground" />
      <p class="text-sm font-medium">{$t('notes.comments.heading')}</p>
      <span class="ui:text-muted-foreground text-xs">{$t('notes.comments.count', { count: 0 })}</span>
    </div>

    {#if canWrite}
      <Button variant="secondary" size="sm" disabled>
        {$t('notes.comments.add')}
      </Button>
    {/if}
  </div>

  <p class="ui:text-muted-foreground mt-2 text-sm">{$t('notes.comments.empty')}</p>
</section>
