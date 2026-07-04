<script lang="ts">
  import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
  import HistoryIcon from '@lucide/svelte/icons/history';
  import ShareIcon from '@lucide/svelte/icons/share-2';
  import TrashIcon from '@lucide/svelte/icons/trash-2';
  import SparklesIcon from '@lucide/svelte/icons/sparkles';
  import EllipsisVerticalIcon from '@lucide/svelte/icons/ellipsis-vertical';
  import LoaderIcon from '@lucide/svelte/icons/loader';
  import XIcon from '@lucide/svelte/icons/x';
  import { onDestroy } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { resolve } from '$app/paths';
  import { Button } from '@cio/ui/base/button';
  import { IconButton } from '@cio/ui/custom/icon-button';
  import type { Content, TiptapEditor } from '@cio/ui/custom/editor';
  import { NoteCommentMark } from '@cio/ui/custom/editor';
  import { Input } from '@cio/ui/base/input';
  import { Badge } from '@cio/ui/base/badge';
  import * as Dialog from '@cio/ui/base/dialog';
  import * as DropdownMenu from '@cio/ui/base/dropdown-menu';
  import { Waves } from '@cio/ui/custom/animation';
  import { TextEditor } from '$features/ui';
  import { tagApi } from '$features/tag/api';
  import { currentOrgPath } from '$lib/utils/store/org';
  import { profile } from '$lib/utils/store/user';
  import { t } from '$lib/utils/functions/translations';
  import { toggleAiAssistant } from '$features/ai-assistant/utils/store';
  import { snackbar } from '$features/ui/snackbar/store';
  import { notesApi, noteCommentsApi } from '../api';
  import { orgApi } from '$features/org/api/org.svelte';
  import type { MentionItem } from '@cio/ui/custom/mention-popover';
  import NoteShareDialog from '../components/note-share-dialog.svelte';
  import NoteTagPicker from '../components/note-tag-picker.svelte';
  import NoteVersionHistory from '../components/note-version-history.svelte';
  import NoteCommentsPanel from '../components/note-comments-panel.svelte';
  import NoteCommentSelection from '../components/note-comment-selection.svelte';
  import {
    buildCommentAnchor,
    createThreadId,
    reapplyCommentMarkInEditor,
    scrollToCommentAnchor,
    stripCommentMarkFromHtml,
    syncActiveCommentMark
  } from '../utils/comment-utils';
  import { connectNoteCommentStream } from '../utils/comment-stream';
  import type { TNoteCommentAnchor } from '@cio/utils/validation/notes';
  import type { NoteCommentThread, NoteShareVisibility } from '../utils/types';

  interface Props {
    noteId: string;
  }

  let { noteId }: Props = $props();

  let title = $state('');
  let content = $state('');
  let noteOrigin = $state<'workspace' | 'lesson_capture' | null>(null);
  let noteVisibility = $state<NoteShareVisibility>('private');
  let ownerFullname = $state<string | null>(null);
  let canWrite = $state(true);
  let selectedTagIds = $state<string[]>([]);
  let isTagPopoverOpen = $state(false);
  let showShareDialog = $state(false);
  let isLoading = $state(true);
  let isSaving = $state(false);
  let isSavingTags = $state(false);
  let loadError = $state<string | null>(null);
  let showVersionHistory = $state(false);
  let showDeleteDialog = $state(false);
  let isDeleting = $state(false);
  let saveTimer: ReturnType<typeof setTimeout> | null = null;
  let titleSaveTimer: ReturnType<typeof setTimeout> | null = null;
  let editor = $state<TiptapEditor | undefined>();
  let editorRoot = $state<HTMLElement | undefined>();
  let activeThreadId = $state<string | null>(null);
  let pendingComposer = $state<{
    threadId: string;
    anchor: TNoteCommentAnchor;
    draft: string;
  } | null>(null);
  let disconnectCommentStream: (() => void) | null = null;

  const mentionItems = $derived.by((): MentionItem[] =>
    orgApi.teamMembers
      .filter((member) => member.profileId)
      .map((member) => ({
        id: member.profileId!,
        label: member.fullname || member.email,
        type: 'user'
      }))
  );

  const canComment = $derived(!isLoading && !loadError && (canWrite || noteVisibility === 'team'));
  const commentExtensions = [NoteCommentMark];

  async function loadNote() {
    isLoading = true;
    loadError = null;

    const note = await notesApi.getNote(noteId);

    if (!note) {
      loadError = t.get('notes.editor.load_error');
      isLoading = false;
      return;
    }

    title = note.title;
    content = note.content;
    noteOrigin = note.origin;
    noteVisibility = note.visibility === 'team' ? 'team' : 'private';
    ownerFullname = note.ownerFullname;
    canWrite = note.canWrite ?? note.ownerId === $profile.id;

    if (note.origin === 'workspace' && canWrite) {
      await tagApi.getTagGroups();
      selectedTagIds = (await notesApi.getNoteTags(noteId)).map((tag) => tag.id);
    }

    isLoading = false;
    void orgApi.getOrgTeam();
    await noteCommentsApi.listThreads(noteId);
    focusThreadFromQuery();
  }

  function focusThreadFromQuery() {
    const threadId = $page.url.searchParams.get('thread');

    if (!threadId) {
      return;
    }

    const thread = noteCommentsApi.threads.find((item) => item.id === threadId);

    if (!thread) {
      return;
    }

    activeThreadId = thread.id;

    if (thread.status === 'resolved') {
      handleScrollToThread(thread);
    }
  }

  function handleDocumentVisibilityChange() {
    if (document.visibilityState === 'visible' && noteId) {
      void noteCommentsApi.listThreads(noteId);
    }
  }

  onDestroy(() => {
    noteCommentsApi.reset();
    disconnectCommentStream?.();
    disconnectCommentStream = null;

    if (saveTimer) {
      clearTimeout(saveTimer);
    }

    if (titleSaveTimer) {
      clearTimeout(titleSaveTimer);
    }
  });

  async function persistTags(nextTagIds: string[]) {
    isSavingTags = true;
    const tags = await notesApi.updateNoteTags(noteId, nextTagIds);
    isSavingTags = false;

    if (!tags) {
      snackbar.error('notes.tags.save_error');
      return;
    }

    selectedTagIds = tags.map((tag) => tag.id);
  }

  function toggleTagSelection(tagId: string) {
    const nextTagIds = selectedTagIds.includes(tagId)
      ? selectedTagIds.filter((id) => id !== tagId)
      : [...selectedTagIds, tagId];

    selectedTagIds = nextTagIds;
    void persistTags(nextTagIds);
  }

  function removeSelectedTag(tagId: string) {
    selectedTagIds = selectedTagIds.filter((id) => id !== tagId);
    void persistTags(selectedTagIds);
  }

  const selectedTagChips = $derived.by(() => {
    const allTags = tagApi.tagGroups.flatMap((group) => group.tags);
    const tagById = new Map(allTags.map((tag) => [tag.id, tag]));

    return selectedTagIds
      .map((tagId) => tagById.get(tagId))
      .filter((tag): tag is NonNullable<typeof tag> => Boolean(tag));
  });

  async function persistContent(nextContent: string) {
    isSaving = true;
    await notesApi.updateNote(noteId, { content: nextContent });
    isSaving = false;
  }

  async function persistTitle(nextTitle: string) {
    isSaving = true;
    await notesApi.updateNote(noteId, { title: nextTitle });
    isSaving = false;
  }

  function scheduleContentSave(nextContent: Content) {
    if (!canWrite) return;

    const html = `${nextContent}`;
    content = html;

    if (saveTimer) {
      clearTimeout(saveTimer);
    }

    saveTimer = setTimeout(() => {
      void persistContent(html);
    }, 800);
  }

  function scheduleTitleSave(event: Event) {
    if (!canWrite) return;

    const input = event.currentTarget;
    if (!(input instanceof HTMLInputElement)) return;

    const nextTitle = input.value.trim() || t.get('notes.org.new_note_title');
    title = nextTitle;

    if (titleSaveTimer) {
      clearTimeout(titleSaveTimer);
    }

    titleSaveTimer = setTimeout(() => {
      void persistTitle(nextTitle);
    }, 500);
  }

  function handleBack() {
    void goto(resolve(`${$currentOrgPath}/notes`, {}));
  }

  async function handleDeleteNote() {
    isDeleting = true;
    const deleted = await notesApi.deleteNote(noteId);
    isDeleting = false;

    if (!deleted) {
      snackbar.error('notes.editor.delete_error');
      return;
    }

    snackbar.success('notes.editor.delete_success');
    showDeleteDialog = false;
    void goto(resolve(`${$currentOrgPath}/notes`, {}));
  }

  function handleVersionRestore(restoredContent: string) {
    content = restoredContent;
    showVersionHistory = false;
  }

  function handleEditorReady(nextEditor: TiptapEditor) {
    editor = nextEditor;
    editorRoot = nextEditor.view.dom as HTMLElement;
  }

  function handleStartComment() {
    if (!editor || !canComment || pendingComposer) {
      return;
    }

    const threadId = createThreadId();
    const applied = editor.chain().focus().setNoteComment({ threadId }).run();

    if (!applied) {
      return;
    }

    const anchor = buildCommentAnchor(editor, threadId);
    content = editor.getHTML();
    pendingComposer = { threadId, anchor, draft: '' };
    activeThreadId = threadId;
  }

  async function handleSubmitPendingComment() {
    if (!pendingComposer || !editor) {
      return;
    }

    const payload = pendingComposer;
    const nextContent = editor.getHTML();

    const created = await noteCommentsApi.createThread(noteId, {
      threadId: payload.threadId,
      body: payload.draft.trim(),
      anchor: payload.anchor,
      content: nextContent
    });

    if (!created) {
      return;
    }

    content = nextContent;
    pendingComposer = null;
    activeThreadId = created.id;
  }

  function handleCancelPendingComment() {
    if (!editor || !pendingComposer) {
      pendingComposer = null;

      return;
    }

    editor.commands.unsetNoteComment({ threadId: pendingComposer.threadId });
    content = editor.getHTML();
    pendingComposer = null;
    activeThreadId = null;
  }

  async function handleResolveThread(thread: NoteCommentThread) {
    const nextContent = stripCommentMarkFromHtml(content, thread.id);
    content = nextContent;
    editor?.commands.setContent(nextContent, false);

    await noteCommentsApi.updateThreadStatus(noteId, thread.id, {
      status: 'resolved',
      content: nextContent
    });
  }

  async function handleReopenThread(thread: NoteCommentThread) {
    let reappliedContent: string | undefined;

    if (editor) {
      const reapplied = reapplyCommentMarkInEditor(editor, thread.id, thread.anchor);

      if (reapplied) {
        reappliedContent = editor.getHTML();
        content = reappliedContent;
      }
    }

    await noteCommentsApi.updateThreadStatus(noteId, thread.id, {
      status: 'open',
      ...(reappliedContent ? { content: reappliedContent } : {})
    });
  }

  function handleScrollToThread(thread: NoteCommentThread) {
    activeThreadId = thread.id;

    if (editorRoot) {
      scrollToCommentAnchor(editorRoot, thread.anchor, thread.id);
    }
  }

  $effect(() => {
    syncActiveCommentMark(editorRoot, activeThreadId);
  });

  $effect(() => {
    if (!editorRoot) {
      return;
    }

    const handleEditorClick = (event: MouseEvent) => {
      const target = event.target;

      if (!(target instanceof Element)) {
        return;
      }

      const mark = target.closest('[data-note-comment]');

      if (!(mark instanceof HTMLElement) || !editorRoot.contains(mark)) {
        return;
      }

      const threadId = mark.getAttribute('data-note-comment');

      if (!threadId) {
        return;
      }

      activeThreadId = threadId;
    };

    editorRoot.addEventListener('click', handleEditorClick);

    return () => {
      editorRoot.removeEventListener('click', handleEditorClick);
    };
  });

  $effect(() => {
    noteId;
    void loadNote();
  });

  $effect(() => {
    if (isLoading || loadError || !noteId) {
      return;
    }

    disconnectCommentStream?.();
    disconnectCommentStream = connectNoteCommentStream(noteId, () => {
      void noteCommentsApi.listThreads(noteId);
    });

    return () => {
      disconnectCommentStream?.();
      disconnectCommentStream = null;
    };
  });
</script>

<svelte:document onvisibilitychange={handleDocumentVisibilityChange} />

<div class="mx-auto flex min-h-[calc(100vh-10rem)] w-full max-w-6xl flex-col gap-4 px-1 pt-2 pb-8">
  <header class="flex flex-wrap items-center gap-3">
    <IconButton variant="secondary" size="icon" onclick={handleBack}>
      <ArrowLeftIcon size={16} />
    </IconButton>

    <div class="ml-auto flex items-center gap-2">
      {#if isSaving}
        <LoaderIcon size={16} class="ui:text-muted-foreground animate-spin" />
      {/if}

      {#if canWrite && noteOrigin === 'workspace'}
        <Button variant="secondary" size="sm" onclick={() => (showShareDialog = true)}>
          <ShareIcon size={16} />
          {$t('notes.share.open')}
        </Button>
      {/if}

      {#if canWrite}
        <Button
          size="sm"
          onclick={toggleAiAssistant}
          class="ui:bg-primary ui:text-primary-foreground relative overflow-hidden border-0"
        >
          <Waves
            lineColor="rgba(255,255,255,0.55)"
            xGap={8}
            yGap={12}
            waveAmpX={18}
            waveAmpY={9}
            waveSpeedX={0.04}
            waveSpeedY={0.02}
          />
          <SparklesIcon size={14} class="relative z-10" />
          <span class="relative z-10">{$t('course.navItems.nav_ai_assistant')}</span>
        </Button>
      {/if}

      {#if canWrite}
        <DropdownMenu.Root>
          <DropdownMenu.Trigger>
            {#snippet child({ props })}
              <IconButton {...props} variant="secondary" size="icon" aria-label={$t('notes.editor.more_actions')}>
                <EllipsisVerticalIcon size={16} />
              </IconButton>
            {/snippet}
          </DropdownMenu.Trigger>
          <DropdownMenu.Content align="end">
            <DropdownMenu.Item onclick={() => (showVersionHistory = true)}>
              <HistoryIcon size={16} />
              {$t('notes.editor.version_history.open')}
            </DropdownMenu.Item>
            {#if noteOrigin === 'workspace'}
              <DropdownMenu.Separator />
              <DropdownMenu.Item class="text-red-600" onclick={() => (showDeleteDialog = true)}>
                <TrashIcon size={16} />
                {$t('notes.editor.delete')}
              </DropdownMenu.Item>
            {/if}
          </DropdownMenu.Content>
        </DropdownMenu.Root>
      {/if}
    </div>
  </header>

  <div class="flex flex-col gap-2">
    <Input
      value={title}
      readonly={!canWrite}
      class="ui:h-auto ui:w-full ui:rounded-none ui:border-0 ui:bg-transparent ui:px-0 ui:py-0 ui:text-3xl ui:font-semibold ui:shadow-none ui:focus-visible:border-0 ui:focus-visible:ring-0"
      placeholder={$t('notes.editor.title_placeholder')}
      oninput={scheduleTitleSave}
    />

    {#if !canWrite && ownerFullname}
      <Badge variant="secondary" class="w-fit">{$t('notes.share.by_author', { name: ownerFullname })}</Badge>
    {/if}
  </div>

  {#if !isLoading && !loadError && !canWrite}
    <p class="ui:text-muted-foreground text-sm">
      {$t('notes.share.read_only_banner')}
    </p>
  {/if}

  {#if !isLoading && !loadError && noteOrigin === 'workspace' && canWrite}
    <div class="flex flex-wrap items-center gap-2">
      <span class="ui:text-muted-foreground text-sm font-medium">{$t('notes.tags.heading')}</span>

      {#each selectedTagChips as tag (tag.id)}
        <Badge variant="secondary" class="gap-1">
          <span
            class="inline-block h-2 w-2 rounded-full border"
            style={`background-color: ${tag.color}`}
            aria-hidden="true"
          ></span>
          <span>{tag.name}</span>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            class="h-5 w-5"
            onclick={() => removeSelectedTag(tag.id)}
          >
            <XIcon />
          </Button>
        </Badge>
      {/each}

      <NoteTagPicker
        tagGroups={tagApi.tagGroups}
        {selectedTagIds}
        bind:open={isTagPopoverOpen}
        onTagToggle={toggleTagSelection}
      />

      {#if isSavingTags}
        <LoaderIcon size={14} class="ui:text-muted-foreground animate-spin" />
      {/if}
    </div>
  {/if}

  <div class="flex min-h-0 flex-1 flex-col gap-4 lg:flex-row">
    <div class="relative min-h-0 min-w-0 flex-1">
      {#if isLoading}
        <div class="ui:text-muted-foreground flex h-40 items-center justify-center text-sm">
          <LoaderIcon size={18} class="mr-2 animate-spin" />
          {$t('notes.editor.loading')}
        </div>
      {:else if loadError}
        <p class="ui:text-destructive text-sm">{loadError}</p>
      {:else}
        <TextEditor
          {content}
          showToolBar={false}
          editable={canWrite}
          extraExtensions={commentExtensions}
          class="border-none shadow-none"
          editorClass="min-h-[60vh] px-0"
          onChange={scheduleContentSave}
          onReady={handleEditorReady}
          placeholder={$t('notes.editor.placeholder')}
        />
        <NoteCommentSelection root={editorRoot} enabled={canComment} onComment={handleStartComment} />
        <p class="ui:text-muted-foreground mt-2 text-xs">{$t('notes.editor.slash_hint')}</p>
      {/if}
    </div>

    {#if !isLoading && !loadError}
      <NoteCommentsPanel
        {noteId}
        {canComment}
        currentUserId={$profile.id}
        {mentionItems}
        bind:pendingComposer
        {activeThreadId}
        onSelectThread={(threadId) => (activeThreadId = threadId)}
        onRequestScroll={handleScrollToThread}
        onSubmitPending={handleSubmitPendingComment}
        onCancelPending={handleCancelPendingComment}
        onResolveThread={handleResolveThread}
        onReopenThread={handleReopenThread}
      />
    {/if}
  </div>
</div>

<NoteShareDialog
  {noteId}
  visibility={noteVisibility}
  bind:open={showShareDialog}
  onVisibilityChange={(visibility) => {
    noteVisibility = visibility;
  }}
/>

<NoteVersionHistory
  {noteId}
  open={showVersionHistory}
  onClose={() => (showVersionHistory = false)}
  onRestore={handleVersionRestore}
/>

<Dialog.Root bind:open={showDeleteDialog}>
  <Dialog.Content class="max-w-md">
    <Dialog.Header>
      <Dialog.Title>{$t('notes.editor.delete_title')}</Dialog.Title>
      <Dialog.Description>{$t('notes.editor.delete_description')}</Dialog.Description>
    </Dialog.Header>
    <Dialog.Footer>
      <Button variant="secondary" onclick={() => (showDeleteDialog = false)}>{$t('notes.share.cancel')}</Button>
      <Button variant="destructive" loading={isDeleting} onclick={handleDeleteNote}>
        {$t('notes.editor.delete_confirm')}
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
