<script lang="ts">
  import { cn } from '@cio/ui/tools';
  import { t } from '$lib/utils/functions/translations';
  import { docCommentsBridge } from '../utils/doc-comments-bridge.svelte';
  import { docCommentsApi } from '../api';
  import NoteCommentsPanel from './doc-comments-panel.svelte';

  interface Props {
    class?: string;
  }

  let { class: className = '' }: Props = $props();

  const bridge = docCommentsBridge;
</script>

<aside
  class={cn(
    'border-border ui:bg-background/95 sticky top-0 flex h-[calc(100dvh-4rem)] w-72 shrink-0 flex-col border-l backdrop-blur-sm',
    className
  )}
>
  <header class="border-border shrink-0 border-b px-4 py-3">
    <p class="text-sm font-semibold">{$t('docs.comments.heading')}</p>
    <p class="ui:text-muted-foreground text-xs">
      {$t('docs.comments.count', { count: docCommentsApi.threads.length })}
    </p>
  </header>

  {#if bridge.docId}
    <div class="min-h-0 flex-1 overflow-hidden">
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
    </div>
  {/if}
</aside>
