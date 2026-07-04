<script lang="ts">
  import CheckIcon from '@lucide/svelte/icons/check';
  import RotateCcwIcon from '@lucide/svelte/icons/rotate-ccw';
  import { Button } from '@cio/ui/base/button';
  import { TextareaField } from '@cio/ui/custom/textarea-field';
  import { UserAvatar } from '@cio/ui/custom/user-avatar';
  import { calDateDiff } from '$lib/utils/functions/date';
  import { t } from '$lib/utils/functions/translations';
  import { noteCommentsApi } from '../api';
  import type { NoteCommentThread } from '../utils/types';
  import type { TNoteCommentAnchor } from '@cio/utils/validation/notes';

  interface PendingComposer {
    threadId: string;
    anchor: TNoteCommentAnchor;
    draft: string;
  }

  interface Props {
    noteId: string;
    canComment?: boolean;
    activeThreadId?: string | null;
    pendingComposer?: PendingComposer | null;
    onSelectThread?: (threadId: string) => void;
    onRequestScroll?: (thread: NoteCommentThread) => void;
    onSubmitPending?: () => void;
    onCancelPending?: () => void;
    onResolveThread?: (thread: NoteCommentThread) => void;
    onReopenThread?: (thread: NoteCommentThread) => void;
  }

  let {
    noteId,
    canComment = true,
    activeThreadId = null,
    pendingComposer = $bindable(null),
    onSelectThread,
    onRequestScroll,
    onSubmitPending,
    onCancelPending,
    onResolveThread,
    onReopenThread
  }: Props = $props();

  let replyDrafts = $state<Record<string, string>>({});

  const openThreads = $derived(noteCommentsApi.threads.filter((thread) => thread.status === 'open'));
  const resolvedThreads = $derived(noteCommentsApi.threads.filter((thread) => thread.status === 'resolved'));

  async function submitReply(threadId: string) {
    const body = replyDrafts[threadId]?.trim();

    if (!body) {
      return;
    }

    replyDrafts[threadId] = '';
    await noteCommentsApi.addReply(noteId, threadId, body);
  }
</script>

<aside class="ui:border-border flex h-full min-h-0 w-full flex-col border-l lg:w-80 lg:shrink-0">
  <header class="ui:border-border border-b px-4 py-3">
    <p class="text-sm font-semibold">{$t('notes.comments.heading')}</p>
    <p class="ui:text-muted-foreground text-xs">
      {$t('notes.comments.count', { count: noteCommentsApi.threads.length })}
    </p>
  </header>

  <div class="min-h-0 flex-1 space-y-4 overflow-y-auto p-3">
    {#if pendingComposer}
      <article class="ui:bg-card ui:border-border rounded-lg border p-3 ring-2 ring-amber-400">
        <p class="ui:text-muted-foreground mb-2 line-clamp-2 text-xs italic">
          "{pendingComposer.anchor.quotedText}"
        </p>
        <TextareaField
          label={$t('notes.comments.new_thread_label')}
          bind:value={pendingComposer.draft}
          placeholder={$t('notes.comments.reply_placeholder')}
        />
        <div class="mt-2 flex gap-2">
          <Button size="sm" onclick={() => onSubmitPending?.()} disabled={!pendingComposer.draft.trim()}>
            {$t('notes.comments.post')}
          </Button>
          <Button size="sm" variant="secondary" onclick={() => onCancelPending?.()}>
            {$t('notes.share.cancel')}
          </Button>
        </div>
      </article>
    {/if}

    {#if !pendingComposer && openThreads.length === 0 && resolvedThreads.length === 0}
      <p class="ui:text-muted-foreground px-1 text-sm">{$t('notes.comments.empty')}</p>
    {/if}

    {#if openThreads.length > 0}
      <p class="ui:text-muted-foreground px-1 text-xs font-medium uppercase">{$t('notes.comments.open_heading')}</p>
    {/if}

    {#each openThreads as thread (thread.id)}
      <article
        class={`ui:bg-card ui:border-border rounded-lg border p-3 ${activeThreadId === thread.id ? 'ring-primary ring-2' : ''}`}
      >
        <button
          type="button"
          class="mb-2 w-full text-left"
          onclick={() => {
            onSelectThread?.(thread.id);
            onRequestScroll?.(thread);
          }}
        >
          <p class="ui:text-muted-foreground line-clamp-2 text-xs italic">"{thread.anchor.quotedText}"</p>
        </button>

        <div class="space-y-3">
          {#each thread.comments as comment (comment.id)}
            <div class="flex items-start gap-2">
              <UserAvatar src={comment.authorAvatarUrl} alt={comment.authorFullname ?? 'User'} class="mt-0.5 size-6!" />
              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-2">
                  <p class="truncate text-xs font-medium">{comment.authorFullname ?? $t('notes.comments.anonymous')}</p>
                  <span class="ui:text-muted-foreground text-[11px]">{calDateDiff(new Date(comment.createdAt))}</span>
                </div>
                <p class="mt-1 text-sm whitespace-pre-wrap">{comment.body}</p>
              </div>
            </div>
          {/each}
        </div>

        {#if canComment}
          <div class="mt-3 space-y-2">
            <TextareaField
              label={$t('notes.comments.reply_label')}
              bind:value={replyDrafts[thread.id]}
              placeholder={$t('notes.comments.reply_placeholder')}
            />
            <div class="flex flex-wrap gap-2">
              <Button size="sm" onclick={() => submitReply(thread.id)} disabled={!replyDrafts[thread.id]?.trim()}>
                {$t('notes.comments.reply')}
              </Button>
              <Button size="sm" variant="secondary" onclick={() => onResolveThread?.(thread)}>
                <CheckIcon size={14} />
                {$t('notes.comments.resolve')}
              </Button>
            </div>
          </div>
        {/if}
      </article>
    {/each}

    {#if resolvedThreads.length > 0}
      <p class="ui:text-muted-foreground px-1 pt-2 text-xs font-medium uppercase">
        {$t('notes.comments.resolved_heading')}
      </p>
    {/if}

    {#each resolvedThreads as thread (thread.id)}
      <article class="ui:bg-muted/20 ui:border-border rounded-lg border p-3 opacity-80">
        <button type="button" class="mb-2 w-full text-left" onclick={() => onRequestScroll?.(thread)}>
          <p class="ui:text-muted-foreground line-clamp-2 text-xs italic">"{thread.anchor.quotedText}"</p>
        </button>

        <div class="space-y-2">
          {#each thread.comments as comment (comment.id)}
            <p class="text-sm whitespace-pre-wrap">{comment.body}</p>
          {/each}
        </div>

        {#if canComment}
          <Button size="sm" variant="secondary" class="mt-3" onclick={() => onReopenThread?.(thread)}>
            <RotateCcwIcon size={14} />
            {$t('notes.comments.reopen')}
          </Button>
        {/if}
      </article>
    {/each}
  </div>
</aside>
