<script lang="ts">
  import * as Popover from '@cio/ui/base/popover';
  import { Input } from '@cio/ui/base/input';
  import { tick } from 'svelte';
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

  interface StudentMessageUsage {
    used: number;
    cap: number;
  }

  interface Props {
    tokenUsage: TokenUsage | null;
    isStudent: boolean;
    studentMessageUsage: StudentMessageUsage | null;
    conversations: Conversation[];
    activeConversationId: string | null;
    conversationTitle: string | null;
    isNewChatDisabled: boolean;
    onNewChat: () => void;
    onLoadConversation: (id: string) => void;
    onDeleteConversation: (id: string) => void;
    /** Resolves on success; rejects with Error when rename fails (message is user-presentable). */
    onRenameConversation: (id: string, title: string) => Promise<void>;
  }

  let {
    tokenUsage,
    isStudent,
    studentMessageUsage,
    conversations,
    activeConversationId,
    conversationTitle,
    isNewChatDisabled,
    onNewChat,
    onLoadConversation,
    onDeleteConversation,
    onRenameConversation
  }: Props = $props();

  let historyPopoverOpen = $state(false);

  let editingConversationTitle = $state(false);
  let draftConversationTitle = $state('');
  let renameConversationError = $state<string | null>(null);
  let titleInputRef: HTMLInputElement | null = $state(null);

  let renameCommitInFlight = $state(false);
  let snapshotConversationIdForRename = $state<string | null>(null);

  const canRenameConversation = $derived(
    Boolean(activeConversationId && conversationTitle && conversationTitle !== 'New conversation')
  );

  function handleLoadConversation(id: string) {
    onLoadConversation(id);
    historyPopoverOpen = false;
  }

  function cancelRenameConversation() {
    if (renameCommitInFlight) {
      return;
    }

    if (!editingConversationTitle) {
      return;
    }

    editingConversationTitle = false;
    renameConversationError = null;
    draftConversationTitle = conversationTitle ?? '';
    snapshotConversationIdForRename = null;
  }

  $effect(() => {
    if (
      editingConversationTitle &&
      snapshotConversationIdForRename != null &&
      activeConversationId !== snapshotConversationIdForRename
    ) {
      cancelRenameConversation();
    }
  });

  async function startRenameConversation() {
    if (!canRenameConversation || !activeConversationId || !conversationTitle) {
      return;
    }

    renameConversationError = null;
    draftConversationTitle = conversationTitle;
    snapshotConversationIdForRename = activeConversationId;
    editingConversationTitle = true;

    await tick();

    titleInputRef?.focus();
    titleInputRef?.select();
  }

  async function commitRenameConversation() {
    if (!activeConversationId) {
      return;
    }

    const trimmedTitle = draftConversationTitle.trim();

    if (trimmedTitle.length === 0) {
      cancelRenameConversation();

      return;
    }

    if (trimmedTitle === conversationTitle) {
      editingConversationTitle = false;
      renameConversationError = null;
      snapshotConversationIdForRename = null;

      return;
    }

    renameCommitInFlight = true;

    try {
      await onRenameConversation(activeConversationId, trimmedTitle);
      editingConversationTitle = false;
      renameConversationError = null;
      snapshotConversationIdForRename = null;
    } catch (renameError) {
      const message = renameError instanceof Error ? renameError.message : t.get('ai_assistant.rename_chat_failed');

      renameConversationError = message;
    } finally {
      renameCommitInFlight = false;
    }
  }

  function handleTitleKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      event.preventDefault();
      void commitRenameConversation();
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      cancelRenameConversation();
    }
  }
</script>

<div class="border-b px-4 py-3">
  <div class="flex items-center justify-between">
    <div class="flex min-w-0 items-center gap-2">
      <SparklesIcon size={18} class="ui:text-primary shrink-0" />
      <div class="min-w-0">
        <h3 class="text-sm font-semibold">{$t('course.navItems.nav_ai_assistant')}</h3>
        {#if conversationTitle && conversationTitle !== 'New conversation'}
          {#if editingConversationTitle}
            <div class="min-w-0">
              <Input
                bind:ref={titleInputRef}
                bind:value={draftConversationTitle}
                class="ui:h-7 ui:min-h-0 ui:px-1.5 ui:py-0 text-xs"
                placeholder={$t('ai_assistant.rename_chat_placeholder')}
                aria-label={$t('ai_assistant.rename_chat_input_aria')}
                onkeydown={handleTitleKeydown}
                onblur={cancelRenameConversation}
              />
              {#if renameConversationError}
                <p class="ui:text-destructive mt-0.5 text-[10px]">{renameConversationError}</p>
              {/if}
            </div>
          {:else}
            <button
              type="button"
              class="ui:text-muted-foreground ui:max-w-full ui:cursor-pointer ui:rounded-md ui:border ui:border-transparent ui:px-1.5 ui:py-0.5 hover:ui:bg-muted/40 hover:ui:border-border truncate text-left text-xs"
              aria-label={$t('ai_assistant.rename_chat_aria')}
              disabled={!canRenameConversation}
              onclick={startRenameConversation}
            >
              {conversationTitle}
            </button>
          {/if}
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
  {#if isStudent && studentMessageUsage}
    {@const usagePercent = Math.min(100, Math.round((studentMessageUsage.used / studentMessageUsage.cap) * 100))}
    <div class="mt-2">
      <div class="ui:text-muted-foreground flex justify-between text-[10px]">
        <span
          >{studentMessageUsage.used.toLocaleString()} / {studentMessageUsage.cap.toLocaleString()}
          {$t('ai_assistant.messages_used_label')}</span
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
  {:else if !isStudent && tokenUsage && tokenUsage.used + tokenUsage.remaining > 0}
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
