<script lang="ts">
  import CheckIcon from '@lucide/svelte/icons/check';
  import PencilIcon from '@lucide/svelte/icons/pencil';
  import RotateCcwIcon from '@lucide/svelte/icons/rotate-ccw';
  import TrashIcon from '@lucide/svelte/icons/trash-2';
  import { Button } from '@cio/ui/base/button';
  import { ChatTextarea } from '@cio/ui/custom/chat-textarea';
  import type { MentionItem } from '@cio/ui/custom/mention-popover';
  import { UserAvatar } from '@cio/ui/custom/user-avatar';
  import { calDateDiff } from '$lib/utils/functions/date';
  import { t } from '$lib/utils/functions/translations';
  import { noteCommentsApi } from '../api';
  import { renderNoteCommentMentions } from '../utils/mention-utils';
  import type { NoteComment, NoteCommentThread } from '../utils/types';
  import type { TNoteCommentAnchor } from '@cio/utils/validation/notes';

  const COMMENT_AUTOSAVE_MS = 800;

  function createDebouncedCallback(delayMs: number) {
    let timer: ReturnType<typeof setTimeout> | null = null;

    return (callback: () => void) => {
      if (timer) {
        clearTimeout(timer);
      }

      timer = setTimeout(callback, delayMs);
    };
  }

  interface PendingComposer {
    threadId: string;
    anchor: TNoteCommentAnchor;
    draft: string;
  }

  interface Props {
    noteId: string;
    canComment?: boolean;
    currentUserId?: string | null;
    mentionItems?: MentionItem[];
    activeThreadId?: string | null;
    pendingComposer?: PendingComposer | null;
    onSelectThread?: (threadId: string) => void;
    onRequestScroll?: (thread: NoteCommentThread) => void;
    onSubmitPending?: () => void | Promise<void>;
    onCancelPending?: () => void;
    onResolveThread?: (thread: NoteCommentThread) => void;
    onReopenThread?: (thread: NoteCommentThread) => void;
  }

  let {
    noteId,
    canComment = true,
    currentUserId = null,
    mentionItems = [],
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
  let editDrafts = $state<Record<string, string>>({});
  let editingCommentId = $state<string | null>(null);
  let activeTab = $state<'open' | 'resolved'>('open');
  let pendingDraft = $state('');
  let pendingSubmitting = $state(false);
  let replySubmitting = $state<Record<string, boolean>>({});
  let editSubmitting = $state<Record<string, boolean>>({});

  const debouncedPendingSubmit = createDebouncedCallback(COMMENT_AUTOSAVE_MS);
  const replyDebouncers = new Map<string, ReturnType<typeof createDebouncedCallback>>();
  const debouncedEditSave = createDebouncedCallback(COMMENT_AUTOSAVE_MS);

  function getReplyDebouncer(threadId: string) {
    let debouncer = replyDebouncers.get(threadId);

    if (!debouncer) {
      debouncer = createDebouncedCallback(COMMENT_AUTOSAVE_MS);
      replyDebouncers.set(threadId, debouncer);
    }

    return debouncer;
  }

  const openThreads = $derived(noteCommentsApi.threads.filter((thread) => thread.status === 'open'));
  const resolvedThreads = $derived(noteCommentsApi.threads.filter((thread) => thread.status === 'resolved'));
  const visibleThreads = $derived(activeTab === 'open' ? openThreads : resolvedThreads);

  $effect(() => {
    if (!activeThreadId) {
      return;
    }

    const thread = noteCommentsApi.threads.find((item) => item.id === activeThreadId);

    if (thread?.status === 'resolved') {
      activeTab = 'resolved';
    } else if (thread?.status === 'open') {
      activeTab = 'open';
    }

    const threadElement = document.getElementById(`comment-thread-${activeThreadId}`);

    threadElement?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });

  $effect.pre(() => {
    for (const thread of noteCommentsApi.threads) {
      if (replyDrafts[thread.id] === undefined) {
        replyDrafts[thread.id] = '';
      }
    }
  });

  $effect(() => {
    pendingDraft = pendingComposer?.draft ?? '';
  });

  $effect(() => {
    if (pendingComposer) {
      pendingComposer.draft = pendingDraft;
    }
  });

  $effect(() => {
    if (!pendingComposer || pendingSubmitting) {
      return;
    }

    const draft = pendingDraft.trim();

    if (!draft) {
      return;
    }

    debouncedPendingSubmit(() => {
      void submitPendingComment();
    });
  });

  $effect(() => {
    for (const thread of openThreads) {
      const draft = replyDrafts[thread.id]?.trim();

      if (!draft || replySubmitting[thread.id]) {
        continue;
      }

      const threadId = thread.id;

      getReplyDebouncer(threadId)(() => {
        void submitReply(threadId);
      });
    }
  });

  $effect(() => {
    if (!editingCommentId) {
      return;
    }

    const draft = editDrafts[editingCommentId]?.trim();
    const comment = findCommentById(editingCommentId);

    if (!draft || !comment || editSubmitting[editingCommentId] || draft === comment.body) {
      return;
    }

    const commentId = editingCommentId;

    debouncedEditSave(() => {
      void saveEdit(commentId);
    });
  });

  function findCommentById(commentId: string): NoteComment | undefined {
    for (const thread of noteCommentsApi.threads) {
      const comment = thread.comments.find((item) => item.id === commentId);

      if (comment) {
        return comment;
      }
    }

    return undefined;
  }

  function mentionTypeLabel(_item: MentionItem) {
    return t.get('notes.comments.mention_team_member');
  }

  async function submitPendingComment() {
    if (!pendingComposer || pendingSubmitting || !pendingDraft.trim()) {
      return;
    }

    pendingSubmitting = true;
    await onSubmitPending?.();
    pendingSubmitting = false;
  }

  async function submitReply(threadId: string) {
    const body = replyDrafts[threadId]?.trim();

    if (!body || replySubmitting[threadId]) {
      return;
    }

    replySubmitting[threadId] = true;
    await noteCommentsApi.addReply(noteId, threadId, body);
    replyDrafts[threadId] = '';
    replySubmitting[threadId] = false;
  }

  function startEditing(comment: NoteComment) {
    editingCommentId = comment.id;
    editDrafts[comment.id] = comment.body;
  }

  async function saveEdit(commentId: string) {
    const body = editDrafts[commentId]?.trim();
    const comment = findCommentById(commentId);

    if (!body || !comment || editSubmitting[commentId] || body === comment.body) {
      return;
    }

    editSubmitting[commentId] = true;
    await noteCommentsApi.updateComment(noteId, commentId, body);
    editSubmitting[commentId] = false;
  }

  async function deleteComment(commentId: string) {
    await noteCommentsApi.deleteComment(noteId, commentId);
  }

  function handleSelectThread(thread: NoteCommentThread) {
    onSelectThread?.(thread.id);
    onRequestScroll?.(thread);
  }
</script>

<aside class="ui:border-border flex h-full min-h-0 w-full flex-col border-l lg:w-80 lg:shrink-0">
  <header class="ui:border-border border-b px-4 py-3">
    <p class="text-sm font-semibold">{$t('notes.comments.heading')}</p>
    <p class="ui:text-muted-foreground text-xs">
      {$t('notes.comments.count', { count: noteCommentsApi.threads.length })}
    </p>
    <div class="mt-3 flex gap-1">
      <Button size="sm" variant={activeTab === 'open' ? 'default' : 'secondary'} onclick={() => (activeTab = 'open')}>
        {$t('notes.comments.open_heading')} ({openThreads.length})
      </Button>
      <Button
        size="sm"
        variant={activeTab === 'resolved' ? 'default' : 'secondary'}
        onclick={() => (activeTab = 'resolved')}
      >
        {$t('notes.comments.resolved_heading')} ({resolvedThreads.length})
      </Button>
    </div>
  </header>

  <div class="min-h-0 flex-1 space-y-4 overflow-y-auto p-3">
    {#if pendingComposer && activeTab === 'open'}
      <article class="ui:bg-card ui:border-border rounded-lg border p-3 ring-2 ring-amber-400">
        <p class="ui:text-muted-foreground mb-2 line-clamp-2 text-xs italic">
          "{pendingComposer.anchor.quotedText}"
        </p>
        <label class="mb-1 block text-xs font-medium" for="pending-comment"
          >{$t('notes.comments.new_thread_label')}</label
        >
        <ChatTextarea
          bind:value={pendingDraft}
          {mentionItems}
          typeLabel={mentionTypeLabel}
          placeholder={$t('notes.comments.reply_placeholder')}
          emptyMessage={$t('notes.comments.mention_no_results')}
          rows={2}
        />
        <p class="ui:text-muted-foreground mt-2 text-xs">{$t('notes.comments.autosave_hint')}</p>
        <div class="mt-2 flex gap-2">
          <Button size="sm" variant="secondary" onclick={() => onCancelPending?.()}>
            {$t('notes.share.cancel')}
          </Button>
        </div>
      </article>
    {/if}

    {#if !pendingComposer && noteCommentsApi.threads.length === 0}
      <p class="ui:text-muted-foreground px-1 text-sm">{$t('notes.comments.empty')}</p>
    {:else if visibleThreads.length === 0}
      <p class="ui:text-muted-foreground px-1 text-sm">
        {activeTab === 'open' ? $t('notes.comments.empty_open') : $t('notes.comments.empty_resolved')}
      </p>
    {/if}

    {#each visibleThreads as thread (thread.id)}
      <article
        id={`comment-thread-${thread.id}`}
        class={`ui:bg-card ui:border-border rounded-lg border p-3 ${activeThreadId === thread.id ? 'ring-primary ring-2' : ''} ${thread.status === 'resolved' ? 'ui:bg-muted/20 opacity-80' : ''}`}
      >
        <button type="button" class="mb-2 w-full text-left" onclick={() => handleSelectThread(thread)}>
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
                  {#if currentUserId && comment.authorId === currentUserId && canComment}
                    <div class="ml-auto flex gap-1">
                      <Button size="icon-xs" variant="secondary" onclick={() => startEditing(comment)}>
                        <PencilIcon size={12} />
                      </Button>
                      <Button size="icon-xs" variant="secondary" onclick={() => deleteComment(comment.id)}>
                        <TrashIcon size={12} />
                      </Button>
                    </div>
                  {/if}
                </div>

                {#if editingCommentId === comment.id}
                  <div class="mt-2 space-y-2">
                    <ChatTextarea
                      bind:value={editDrafts[comment.id]}
                      {mentionItems}
                      typeLabel={mentionTypeLabel}
                      emptyMessage={$t('notes.comments.mention_no_results')}
                      rows={2}
                    />
                  </div>
                {:else}
                  <button type="button" class="w-full text-left" onclick={() => handleSelectThread(thread)}>
                    <p class="note-comment-body mt-1 text-sm whitespace-pre-wrap">
                      {@html renderNoteCommentMentions(comment.body)}
                    </p>
                  </button>
                {/if}
              </div>
            </div>
          {/each}
        </div>

        {#if canComment && thread.status === 'open'}
          <div class="mt-3 space-y-2">
            <label class="block text-xs font-medium" for={`reply-${thread.id}`}
              >{$t('notes.comments.reply_label')}</label
            >
            <ChatTextarea
              bind:value={replyDrafts[thread.id]}
              {mentionItems}
              typeLabel={mentionTypeLabel}
              placeholder={$t('notes.comments.reply_placeholder')}
              emptyMessage={$t('notes.comments.mention_no_results')}
              rows={2}
            />
            <div class="flex flex-wrap gap-2">
              <Button size="sm" variant="secondary" onclick={() => onResolveThread?.(thread)}>
                <CheckIcon size={14} />
                {$t('notes.comments.resolve')}
              </Button>
            </div>
          </div>
        {:else if canComment && thread.status === 'resolved'}
          <Button size="sm" variant="secondary" class="mt-3" onclick={() => onReopenThread?.(thread)}>
            <RotateCcwIcon size={14} />
            {$t('notes.comments.reopen')}
          </Button>
        {/if}
      </article>
    {/each}
  </div>
</aside>

<style>
  :global(.note-comment-body .note-comment-mention) {
    font-weight: 600;
    color: var(--primary);
  }
</style>
