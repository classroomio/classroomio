<script lang="ts">
  import { Button } from '@cio/ui/base/button';
  import MessageSquarePlusIcon from '@lucide/svelte/icons/message-square-plus';
  import Minimize2Icon from '@lucide/svelte/icons/minimize-2';
  import LoaderIcon from '@lucide/svelte/icons/loader';
  import { t } from '$lib/utils/functions/translations';

  interface Props {
    contextFullBusy: null | 'compact' | 'new_chat';
    compactConversationDisabled?: boolean;
    onCompactConversation: () => void;
    onStartNewChat: () => void;
  }

  let { contextFullBusy, compactConversationDisabled = false, onCompactConversation, onStartNewChat }: Props = $props();

  const compactBusy = $derived(contextFullBusy === 'compact');
  const busy = $derived(contextFullBusy !== null);
</script>

<div class="border-t px-3 py-4">
  <div
    class="flex flex-col items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-5 text-center dark:border-amber-800 dark:bg-amber-950"
  >
    <p class="text-sm font-medium text-amber-800 dark:text-amber-200">
      {$t('ai_assistant.context_full_title')}
    </p>
    <p class="ui:text-muted-foreground text-xs">
      {$t('ai_assistant.context_full_description')}
    </p>

    <div class="flex w-full max-w-xs flex-col gap-2 pt-1 sm:max-w-sm">
      <Button
        variant="default"
        size="sm"
        onclick={onCompactConversation}
        disabled={busy || compactConversationDisabled}
        class="w-full gap-2"
      >
        {#if compactBusy}
          <LoaderIcon size={14} class="shrink-0 animate-spin" />
          {$t('ai_assistant.context_full_compacting')}
        {:else}
          <Minimize2Icon size={14} class="shrink-0" />
          {$t('ai_assistant.context_full_compact')}
        {/if}
      </Button>

      <Button
        variant="outline"
        size="sm"
        onclick={onStartNewChat}
        disabled={busy}
        class="w-full gap-2 border-amber-300 bg-amber-50/70 text-amber-900 hover:bg-amber-100 dark:border-amber-700 dark:bg-amber-950/80 dark:text-amber-100 dark:hover:bg-amber-900"
      >
        {#if contextFullBusy === 'new_chat'}
          <LoaderIcon size={14} class="shrink-0 animate-spin" />
          {$t('ai_assistant.context_full_summarizing')}
        {:else}
          <MessageSquarePlusIcon size={14} class="shrink-0" />
          {$t('ai_assistant.context_full_new_chat')}
        {/if}
      </Button>
    </div>
  </div>
</div>
