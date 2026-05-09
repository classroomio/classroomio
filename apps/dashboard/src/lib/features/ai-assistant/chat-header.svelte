<script lang="ts">
  import * as Popover from '@cio/ui/base/popover';
  import SparklesIcon from '@lucide/svelte/icons/sparkles';
  import XIcon from '@lucide/svelte/icons/x';
  import PlusIcon from '@lucide/svelte/icons/plus';
  import HistoryIcon from '@lucide/svelte/icons/history';
  import ChatHistoryPopover from '$features/ai-assistant/chat-history-popover.svelte';
  import { closeAiAssistant } from '$features/ai-assistant/utils/store';
  import { t } from '$lib/utils/functions/translations';
  import { IconButton } from '@cio/ui/custom/icon-button';
  import { Button } from '@cio/ui/base/button';

  interface Conversation {
    id: string;
    title: string | null;
    updatedAt: string;
  }

  interface TokenUsage {
    used: number;
    allowance: number;
    remaining: number;
  }

  interface Props {
    tokenUsage: TokenUsage | null;
    conversations: Conversation[];
    activeConversationId: string | null;
    conversationTitle: string | null;
    isNewChatDisabled: boolean;
    onNewChat: () => void;
    onLoadConversation: (id: string) => void;
    onDeleteConversation: (id: string) => void;
  }

  let {
    tokenUsage,
    conversations,
    activeConversationId,
    conversationTitle,
    isNewChatDisabled,
    onNewChat,
    onLoadConversation,
    onDeleteConversation
  }: Props = $props();

  let historyPopoverOpen = $state(false);

  function handleLoadConversation(id: string) {
    onLoadConversation(id);
    historyPopoverOpen = false;
  }
</script>

<div class="border-b px-4 py-3">
  <div class="flex items-center justify-between">
    <div class="flex min-w-0 items-center gap-2">
      <SparklesIcon size={18} class="ui:text-primary shrink-0" />
      <div class="min-w-0">
        <h3 class="text-sm font-semibold">{$t('course.navItems.nav_ai_assistant')}</h3>
        {#if conversationTitle && conversationTitle !== 'New conversation'}
          <p class="ui:text-muted-foreground truncate text-xs">{conversationTitle}</p>
        {/if}
      </div>
    </div>
    <div class="flex items-center gap-2">
      <IconButton
        onclick={onNewChat}
        disabled={isNewChatDisabled}
        variant="outline"
        size="icon-xs"
        tooltip={$t('ai_assistant.new_chat')}
      >
        <PlusIcon size={16} />
      </IconButton>

      <Popover.Root bind:open={historyPopoverOpen}>
        <Popover.Trigger>
          {#snippet child({ props })}
            <Button
              variant="outline"
              size="icon-xs"
              {...props}
              aria-label={$t('ai_assistant.chat_history')}
              title={$t('ai_assistant.chat_history')}
            >
              <HistoryIcon size={16} />
            </Button>
          {/snippet}
        </Popover.Trigger>
        <Popover.Content class="ui:p-0! z-200! w-72" align="center">
          <ChatHistoryPopover
            {conversations}
            {activeConversationId}
            onLoad={handleLoadConversation}
            onDelete={onDeleteConversation}
          />
        </Popover.Content>
      </Popover.Root>

      <IconButton onclick={closeAiAssistant} variant="outline" size="icon-xs">
        <XIcon size={16} />
      </IconButton>
    </div>
  </div>
  {#if tokenUsage && tokenUsage.used + tokenUsage.remaining > 0}
    {@const totalBudget = tokenUsage.used + tokenUsage.remaining}
    {@const usagePercent = Math.min(100, Math.round((tokenUsage.used / totalBudget) * 100))}
    <div class="mt-2">
      <div class="ui:text-muted-foreground flex justify-between text-[10px]">
        <span
          >{tokenUsage.used.toLocaleString()} / {totalBudget.toLocaleString()}
          {$t('ai_assistant.tokens_label')}</span
        >
        <span>{usagePercent}%</span>
      </div>
      <div class="ui:bg-muted mt-0.5 h-1 w-full rounded-full">
        <div
          class="h-1 rounded-full transition-all {usagePercent > 90
            ? 'bg-red-500'
            : usagePercent > 70
              ? 'bg-amber-500'
              : 'ui:bg-primary'}"
          style="width: {usagePercent}%"
        ></div>
      </div>
    </div>
  {/if}
</div>
