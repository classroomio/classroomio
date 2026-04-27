<script lang="ts">
  import MessageSquareIcon from '@lucide/svelte/icons/message-square';
  import TrashIcon from '@lucide/svelte/icons/trash-2';
  import { t } from '$lib/utils/functions/translations';

  interface Conversation {
    id: string;
    title: string | null;
    updatedAt: string;
  }

  interface Props {
    conversations: Conversation[];
    activeConversationId: string | null;
    onLoad: (id: string) => void;
    onDelete: (id: string) => void;
  }

  let { conversations, activeConversationId, onLoad, onDelete }: Props = $props();
</script>

<div class="border-b px-3 py-2">
  <p class="text-xs font-medium">{$t('ai_assistant.chat_history')}</p>
</div>
<div class="max-h-64 overflow-y-auto">
  {#if conversations.length === 0}
    <p class="ui:text-muted-foreground px-3 py-4 text-center text-xs">{$t('ai_assistant.no_conversations')}</p>
  {:else}
    {#each conversations as conversation (conversation.id)}
      <div
        class="group flex items-center gap-2 border-b px-3 py-2 last:border-b-0 {conversation.id ===
        activeConversationId
          ? 'ui:bg-muted'
          : 'hover:ui:bg-muted/50'} transition-colors"
      >
        <button onclick={() => onLoad(conversation.id)} class="flex min-w-0 flex-1 items-center gap-2 text-left">
          <MessageSquareIcon size={14} class="ui:text-muted-foreground flex-shrink-0" />
          <div class="min-w-0">
            <p class="truncate text-xs font-medium">{conversation.title || $t('ai_assistant.untitled')}</p>
            <p class="ui:text-muted-foreground text-[10px]">
              {new Date(conversation.updatedAt).toLocaleDateString()}
            </p>
          </div>
        </button>
        <button
          onclick={() => onDelete(conversation.id)}
          class="ui:text-muted-foreground flex-shrink-0 rounded p-1 opacity-0 transition-all group-hover:opacity-100 hover:text-red-500"
        >
          <TrashIcon size={12} />
        </button>
      </div>
    {/each}
  {/if}
</div>
