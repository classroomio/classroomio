<script lang="ts">
  import MessageSquareIcon from '@lucide/svelte/icons/message-square';
  import XIcon from '@lucide/svelte/icons/x';
  import { IconButton } from '@cio/ui/custom/icon-button';
  import { sidePanel } from '$features/side-panel';
  import { t } from '$lib/utils/functions/translations';
  import { docCommentsBridge } from '../utils/doc-comments-bridge.svelte';
  import NoteCommentsPanel from './doc-comments-panel.svelte';

  const bridge = docCommentsBridge;
</script>

<header class="border-border flex items-center gap-2 border-b px-4 py-3">
  <MessageSquareIcon size={16} class="ui:text-muted-foreground shrink-0" />
  <p class="min-w-0 flex-1 truncate text-sm font-semibold">{$t('docs.comments.heading')}</p>
  <IconButton variant="secondary" size="icon" onclick={() => sidePanel.close()}>
    <XIcon size={16} />
  </IconButton>
</header>

<div class="flex min-h-0 flex-1 flex-col overflow-hidden">
  {#if bridge.docId}
    <NoteCommentsPanel
      docId={bridge.docId}
      canComment={bridge.canComment}
      currentUserId={bridge.currentUserId}
      mentionItems={bridge.mentionItems}
      bind:pendingComposer={bridge.pendingComposer}
      activeThreadId={bridge.activeThreadId}
      onSelectThread={(threadId) => {
        bridge.activeThreadId = threadId;
        bridge.handlers.onSelectThread?.(threadId);
      }}
      onRequestScroll={(thread) => bridge.handlers.onRequestScroll?.(thread)}
      onSubmitPending={() => bridge.handlers.onSubmitPending?.()}
      onCancelPending={() => bridge.handlers.onCancelPending?.()}
      onResolveThread={(thread) => bridge.handlers.onResolveThread?.(thread)}
      onReopenThread={(thread) => bridge.handlers.onReopenThread?.(thread)}
      embedded
    />
  {/if}
</div>
