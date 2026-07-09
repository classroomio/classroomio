<script lang="ts">
  import BookOpenIcon from '@lucide/svelte/icons/book-open';
  import HistoryIcon from '@lucide/svelte/icons/history';
  import MessageSquareIcon from '@lucide/svelte/icons/message-square';
  import ShareIcon from '@lucide/svelte/icons/share-2';
  import TrashIcon from '@lucide/svelte/icons/trash-2';
  import SparklesIcon from '@lucide/svelte/icons/sparkles';
  import EllipsisVerticalIcon from '@lucide/svelte/icons/ellipsis-vertical';
  import LayoutTemplateIcon from '@lucide/svelte/icons/layout-template';
  import LoaderIcon from '@lucide/svelte/icons/loader';
  import XIcon from '@lucide/svelte/icons/x';
  import { onDestroy } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { resolve } from '$app/paths';
  import { Button } from '@cio/ui/base/button';
  import { IconButton } from '@cio/ui/custom/icon-button';
  import type { Content, TiptapEditor } from '@cio/ui/custom/editor';
  import { NoteCommentMark, TABLE_OF_CONTENTS_INITIAL_CONTENT } from '@cio/ui/custom/editor';
  import { Input } from '@cio/ui/base/input';
  import { Badge } from '@cio/ui/base/badge';
  import * as Dialog from '@cio/ui/base/dialog';
  import * as DropdownMenu from '@cio/ui/base/dropdown-menu';
  import { Waves } from '@cio/ui/custom/animation';
  import { TextEditor } from '$features/ui';
  import { tagApi } from '$features/tag/api';
  import { currentOrgPath, currentOrg } from '$lib/utils/store/org';
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
  import NoteCommentSelection from '../components/note-comment-selection.svelte';
  import NoteEmptyPagePicker, { type NoteEmptyPageOption } from '../components/note-empty-page-picker.svelte';
  import NoteConvertCourseDialog from '../components/note-convert-course-dialog.svelte';
  import NoteTemplatePickerDialog from '../components/note-template-picker-dialog.svelte';
  import { toggleNoteCommentsPanel } from '../panel';
  import { noteCommentsBridge } from '../utils/note-comments-bridge.svelte';
  import {
    buildCommentAnchor,
    createThreadId,
    reapplyCommentMarkInEditor,
    scrollToCommentAnchor,
    stripCommentMarkFromHtml,
    syncActiveCommentMark
  } from '../utils/comment-utils';
  import { connectNoteCommentStream } from '../utils/comment-stream';
  import { isNoteContentEmpty } from '../utils/note-content-utils';
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
  let showConvertCourseDialog = $state(false);
  let showTemplatePicker = $state(false);
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
  let emptyPagePickerDismissed = $state(false);
  let importInputRef = $state<HTMLInputElement | null>(null);
  let isImporting = $state(false);

  const showEmptyPagePicker = $derived(
    canWrite &&
      noteOrigin === 'workspace' &&
      !isLoading &&
      !loadError &&
      isNoteContentEmpty(content) &&
      !emptyPagePickerDismissed
  );

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
  const defaultNoteTitle = $derived(t.get('notes.org.new_note_title'));
  const noteTitle = $derived(resolvePersistedTitle(title));

  function resolvePersistedTitle(displayTitle: string) {
    const trimmedTitle = displayTitle.trim();

    return trimmedTitle || defaultNoteTitle;
  }

  function normalizeTitleForDisplay(storedTitle: string) {
    if (storedTitle.trim() === defaultNoteTitle) {
      return '';
    }

    return storedTitle;
  }

  async function loadNote() {
    isLoading = true;
    loadError = null;

    const note = await notesApi.getNote(noteId);

    if (!note) {
      loadError = t.get('notes.editor.load_error');
      isLoading = false;
      return;
    }

    title = normalizeTitleForDisplay(note.title);
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

  function openCommentsPanel() {
    toggleNoteCommentsPanel();
  }

  function syncCommentsBridge() {
    noteCommentsBridge.bindEditorContext({
      noteId,
      canComment,
      currentUserId: $profile.id,
      mentionItems,
      handlers: {
        onSelectThread: (threadId) => {
          activeThreadId = threadId;
        },
        onRequestScroll: handleScrollToThread,
        onSubmitPending: handleSubmitPendingComment,
        onCancelPending: handleCancelPendingComment,
        onResolveThread: handleResolveThread,
        onReopenThread: handleReopenThread
      }
    });
    noteCommentsBridge.activeThreadId = activeThreadId;

    if (noteCommentsBridge.pendingComposer !== pendingComposer) {
      noteCommentsBridge.pendingComposer = pendingComposer;
    }
  }

  $effect(() => {
    activeThreadId;
    pendingComposer;
    canComment;
    mentionItems;
    syncCommentsBridge();
  });

  onDestroy(() => {
    noteCommentsBridge.reset();
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

    const nextTitle = input.value;
    title = nextTitle;
    const persistedTitle = resolvePersistedTitle(nextTitle);

    if (titleSaveTimer) {
      clearTimeout(titleSaveTimer);
    }

    titleSaveTimer = setTimeout(() => {
      void persistTitle(persistedTitle);
    }, 500);
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

  function dismissEmptyPagePicker() {
    emptyPagePickerDismissed = true;
    editor?.commands.focus('end');
  }

  async function handleEmptyPageOption(option: NoteEmptyPageOption) {
    if (option === 'empty') {
      dismissEmptyPagePicker();
      return;
    }

    if (option === 'table_of_contents') {
      content = TABLE_OF_CONTENTS_INITIAL_CONTENT;
      emptyPagePickerDismissed = true;
      await persistContent(TABLE_OF_CONTENTS_INITIAL_CONTENT);
      editor?.commands.setContent(TABLE_OF_CONTENTS_INITIAL_CONTENT, false);
      editor?.commands.focus('end');
      return;
    }

    if (option === 'templates') {
      showTemplatePicker = true;
      return;
    }

    importInputRef?.click();
  }

  async function handleImportFile(file: File) {
    isImporting = true;
    const importedNote = await notesApi.importNote(file);
    isImporting = false;

    if (!importedNote) {
      snackbar.error('notes.org.import_error');
      return;
    }

    if (isNoteContentEmpty(content)) {
      await notesApi.deleteNote(noteId);
    }

    snackbar.success('notes.org.import_success');
    emptyPagePickerDismissed = true;
    await goto(resolve(`${$currentOrgPath}/notes/${importedNote.id}`, {}));
  }

  function handleImportInputChange(event: Event) {
    const input = event.currentTarget;
    if (!(input instanceof HTMLInputElement)) return;

    const file = input.files?.[0];
    input.value = '';

    if (!file) return;

    void handleImportFile(file);
  }

  async function handleConvertToTemplate() {
    const converted = await notesApi.convertToTemplate(noteId);

    if (!converted) {
      snackbar.error('notes.templates.convert_error');
      return;
    }

    snackbar.success('notes.templates.convert_success');
    await notesApi.listNotes({ scope: 'all', origin: 'workspace' });
    await notesApi.listTemplates();
    void goto(resolve(`${$currentOrgPath}/notes`, {}));
  }

  function handleTitleKeydown(event: KeyboardEvent) {
    if (event.key !== 'Enter' || !showEmptyPagePicker) {
      return;
    }

    event.preventDefault();
    dismissEmptyPagePicker();
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
    openCommentsPanel();
  }

  async function handleSubmitPendingComment() {
    const payload = noteCommentsBridge.pendingComposer ?? pendingComposer;

    if (!payload || !editor) {
      return;
    }
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
    const payload = noteCommentsBridge.pendingComposer ?? pendingComposer;

    if (!editor || !payload) {
      pendingComposer = null;
      noteCommentsBridge.pendingComposer = null;

      return;
    }

    editor.commands.unsetNoteComment({ threadId: payload.threadId });
    content = editor.getHTML();
    pendingComposer = null;
    noteCommentsBridge.pendingComposer = null;
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
    if (!isNoteContentEmpty(content)) {
      emptyPagePickerDismissed = true;
    }
  });

  $effect(() => {
    if (!noteId || !$currentOrg.id) {
      return;
    }

    emptyPagePickerDismissed = false;
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

<div class="flex min-h-0 w-full flex-1 flex-col gap-4 px-4 py-2">
  <header class="flex flex-wrap items-center gap-3">
    <Input
      value={title}
      readonly={!canWrite}
      class="ui:h-auto ui:min-w-0 ui:flex-1 ui:rounded-none ui:border-0 ui:bg-transparent ui:px-0 ui:py-0 ui:text-[2.5rem] ui:leading-[1.1] ui:font-bold ui:shadow-none ui:placeholder:text-muted-foreground/45 ui:focus-visible:border-0 ui:focus-visible:ring-0"
      placeholder={$t('notes.org.new_note_title')}
      oninput={scheduleTitleSave}
      onkeydown={handleTitleKeydown}
    />

    <div class="flex shrink-0 items-center gap-2">
      {#if isSaving}
        <LoaderIcon size={16} class="ui:text-muted-foreground animate-spin" />
      {/if}

      {#if canWrite && noteOrigin === 'workspace'}
        <Button variant="secondary" size="sm" onclick={() => (showShareDialog = true)}>
          <ShareIcon size={16} />
          {$t('notes.share.open')}
        </Button>
      {/if}

      {#if canWrite && noteOrigin === 'workspace'}
        <Button variant="secondary" size="sm" onclick={() => (showConvertCourseDialog = true)}>
          <BookOpenIcon size={16} />
          {$t('notes.convert_course.button')}
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
            <DropdownMenu.Item onclick={openCommentsPanel}>
              <MessageSquareIcon size={16} />
              {$t('notes.comments.heading')}
            </DropdownMenu.Item>
            <DropdownMenu.Item onclick={() => (showVersionHistory = true)}>
              <HistoryIcon size={16} />
              {$t('notes.editor.version_history.open')}
            </DropdownMenu.Item>
            {#if noteOrigin === 'workspace'}
              <DropdownMenu.Item onclick={handleConvertToTemplate}>
                <LayoutTemplateIcon size={16} />
                {$t('notes.editor.convert_to_template')}
              </DropdownMenu.Item>
            {/if}
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

  <div class="flex min-h-0 flex-1 flex-col">
    <div class="relative min-h-0 min-w-0 flex-1">
      <input
        bind:this={importInputRef}
        type="file"
        accept=".md,.txt,.docx,text/markdown,text/plain,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        class="hidden"
        onchange={handleImportInputChange}
      />

      {#if isLoading}
        <div class="ui:text-muted-foreground flex h-40 items-center justify-center text-sm">
          <LoaderIcon size={18} class="mr-2 animate-spin" />
          {$t('notes.editor.loading')}
        </div>
      {:else if loadError}
        <p class="ui:text-destructive text-sm">{loadError}</p>
      {:else}
        {#if showEmptyPagePicker}
          <NoteEmptyPagePicker onSelect={handleEmptyPageOption} class="min-h-[40vh]" />
        {/if}

        <div class={showEmptyPagePicker ? 'sr-only' : ''}>
          <TextEditor
            {content}
            showToolBar={false}
            editable={canWrite}
            extraExtensions={commentExtensions}
            class="border-0 shadow-none"
            editorClass="min-h-[60vh] border-0 px-0 shadow-none"
            onChange={scheduleContentSave}
            onReady={handleEditorReady}
            placeholder={$t('notes.editor.placeholder')}
          />
        </div>

        {#if !showEmptyPagePicker}
          <NoteCommentSelection root={editorRoot} enabled={canComment} onComment={handleStartComment} />
          <p class="ui:text-muted-foreground mt-2 text-xs">{$t('notes.editor.slash_hint')}</p>
        {/if}

        {#if isImporting}
          <div class="ui:text-muted-foreground mt-2 flex items-center gap-2 text-sm">
            <LoaderIcon size={16} class="animate-spin" />
            {$t('notes.org.import')}
          </div>
        {/if}
      {/if}
    </div>
  </div>
</div>

<NoteConvertCourseDialog bind:open={showConvertCourseDialog} {noteTitle} noteContent={content} />

<NoteTemplatePickerDialog bind:open={showTemplatePicker} />

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
