<script lang="ts">
  import BookOpenIcon from '@lucide/svelte/icons/book-open';
  import HistoryIcon from '@lucide/svelte/icons/history';
  import MessageSquareIcon from '@lucide/svelte/icons/message-square';
  import ShareIcon from '@lucide/svelte/icons/share-2';
  import TrashIcon from '@lucide/svelte/icons/trash-2';
  import EllipsisVerticalIcon from '@lucide/svelte/icons/ellipsis-vertical';
  import LayoutTemplateIcon from '@lucide/svelte/icons/layout-template';
  import StarIcon from '@lucide/svelte/icons/star';
  import LoaderIcon from '@lucide/svelte/icons/loader';
  import XIcon from '@lucide/svelte/icons/x';
  import { onDestroy } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { resolve } from '$app/paths';
  import { Button } from '@cio/ui/base/button';
  import { IconButton } from '@cio/ui/custom/icon-button';
  import type { Content, TiptapEditor } from '@cio/ui/custom/editor';
  import { DocCommentMark, TABLE_OF_CONTENTS_INITIAL_CONTENT } from '@cio/ui/custom/editor';
  import { Badge } from '@cio/ui/base/badge';
  import * as Dialog from '@cio/ui/base/dialog';
  import * as DropdownMenu from '@cio/ui/base/dropdown-menu';
  import { TextEditor } from '$features/ui';
  import { ContentAskAiBar } from '$features/ai-assistant';
  import { sidePanel } from '$features/side-panel';
  import { tagApi } from '$features/tag/api';
  import { currentOrgPath, currentOrg } from '$lib/utils/store/org';
  import { profile } from '$lib/utils/store/user';
  import { t } from '$lib/utils/functions/translations';
  import { snackbar } from '$features/ui/snackbar/store';
  import { docsApi, docCommentsApi } from '../api';
  import { orgApi } from '$features/org/api/org.svelte';
  import type { MentionItem } from '@cio/ui/custom/mention-popover';
  import NoteShareDialog from '../components/doc-share-dialog.svelte';
  import NoteTagPicker from '../components/doc-tag-picker.svelte';
  import NoteVersionHistory from '../components/doc-version-history.svelte';
  import NoteCommentSelection from '../components/doc-comment-selection.svelte';
  import NoteEmptyPagePicker, { type NoteEmptyPageOption } from '../components/doc-empty-page-picker.svelte';
  import NoteConvertCourseDialog from '../components/doc-convert-course-dialog.svelte';
  import NoteSubpages from '../components/doc-subpages.svelte';
  import NotePageChrome from '../components/doc-page-chrome.svelte';
  import {
    DOC_AI_PANEL_ID,
    DOC_COMMENTS_PANEL_ID,
    openNoteAiFromAskAi,
    openNoteAiPanel,
    toggleNoteCommentsPanel
  } from '../panel';
  import { docCommentsBridge } from '../utils/doc-comments-bridge.svelte';
  import {
    buildCommentAnchor,
    createThreadId,
    reapplyCommentMarkInEditor,
    scrollToCommentAnchor,
    stripCommentMarkFromHtml,
    syncActiveCommentMark
  } from '../utils/comment-utils';
  import { connectNoteCommentStream } from '../utils/comment-stream';
  import { isNoteContentEmpty } from '../utils/doc-content-utils';
  import type { TDocCommentAnchor } from '@cio/utils/validation/docs';
  import type { NoteCommentThread, DocShareVisibility } from '../utils/types';

  interface Props {
    docId: string;
  }

  let { docId }: Props = $props();

  let title = $state('');
  let content = $state('');
  let coverImageUrl = $state<string | null>(null);
  let isSavingCover = $state(false);
  let docOrigin = $state<'organization' | 'lesson_capture' | null>(null);
  let docVisibility = $state<DocShareVisibility>('private');
  let docSlug = $state<string | null>(null);
  let convertedCourseId = $state<string | null>(null);
  let isPinned = $state(false);
  let isFavorited = $state(false);
  let childNotes = $state<Array<{ id: string; title: string; sortOrder?: number; updatedAt?: string }>>([]);
  let noteOwnerId = $state('');
  let isTemplateNote = $state(false);
  let ownerFullname = $state<string | null>(null);
  let publicPageViews = $state(0);
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
  let isDeleting = $state(false);
  let saveTimer: ReturnType<typeof setTimeout> | null = null;
  let titleSaveTimer: ReturnType<typeof setTimeout> | null = null;
  let editor = $state<TiptapEditor | undefined>();
  let editorRoot = $state<HTMLElement | undefined>();
  let activeThreadId = $state<string | null>(null);
  let pendingComposer = $state<{
    threadId: string;
    anchor: TDocCommentAnchor;
    draft: string;
  } | null>(null);
  let disconnectCommentStream: (() => void) | null = null;
  let emptyPagePickerDismissed = $state(false);
  let importInputRef = $state<HTMLInputElement | null>(null);
  let isImporting = $state(false);
  let aiPanelManuallyClosed = $state(false);
  let previousSidePanelId = $state<string | null>(null);

  const showEmptyPagePicker = $derived(
    canWrite &&
      docOrigin === 'organization' &&
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

  const canComment = $derived(!isLoading && !loadError && (canWrite || docVisibility === 'team'));
  const commentsPanelOpen = $derived(sidePanel.activePanelId === DOC_COMMENTS_PANEL_ID);
  const showNoteAskAiBar = $derived(
    canWrite &&
      docOrigin === 'organization' &&
      !isLoading &&
      !loadError &&
      sidePanel.activePanelId !== DOC_AI_PANEL_ID
  );
  const commentExtensions = [DocCommentMark];
  const defaultNoteTitle = $derived(t.get('docs.org.new_note_title'));
  const docTitle = $derived(resolvePersistedTitle(title));

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

    const note = await docsApi.getNote(docId);

    if (!note) {
      loadError = t.get('docs.editor.load_error');
      isLoading = false;
      return;
    }

    title = normalizeTitleForDisplay(note.title);
    content = note.content;
    coverImageUrl = note.coverImageUrl ?? null;
    docOrigin = note.origin;
    docVisibility = note.visibility === 'public' ? 'public' : note.visibility === 'team' ? 'team' : 'private';
    docSlug = note.slug ?? null;
    convertedCourseId = note.convertedCourseId ?? null;
    isPinned = note.isPinned ?? false;
    isFavorited = note.isFavorited ?? false;
    childNotes = note.children ?? [];
    noteOwnerId = note.ownerId;
    isTemplateNote = note.isTemplate ?? false;
    ownerFullname = note.ownerFullname;
    publicPageViews = note.publicPageViews ?? 0;
    canWrite = note.canWrite ?? note.ownerId === $profile.id;

    if (note.origin === 'organization' && canWrite) {
      await tagApi.getTagGroups();
      selectedTagIds = (await docsApi.getNoteTags(docId)).map((tag) => tag.id);
    }

    isLoading = false;
    void orgApi.getOrgTeam();
    await docCommentsApi.listThreads(docId);
    focusThreadFromQuery();
  }

  function focusThreadFromQuery() {
    const threadId = $page.url.searchParams.get('thread');

    if (!threadId) {
      return;
    }

    const thread = docCommentsApi.threads.find((item) => item.id === threadId);

    if (!thread) {
      return;
    }

    activeThreadId = thread.id;

    if (thread.status === 'resolved') {
      handleScrollToThread(thread);
    }
  }

  function handleDocumentVisibilityChange() {
    if (document.visibilityState === 'visible' && docId) {
      void docCommentsApi.listThreads(docId);
    }
  }

  function openCommentsPanel() {
    toggleNoteCommentsPanel();
  }

  function toggleCommentsPanel() {
    if (commentsPanelOpen) {
      sidePanel.close();
      return;
    }

    toggleNoteCommentsPanel();
  }

  function getNoteAiPanelProps() {
    return {
      docId,
      docTitle: title || t.get('docs.org.new_note_title'),
      getNoteContent: () => editor?.getHTML() ?? content,
      getSelectedText: () => {
        if (!editor) {
          return '';
        }

        const { from, to } = editor.state.selection;

        return editor.state.doc.textBetween(from, to, ' ').trim();
      },
      onReviewComplete: (nextContent: string) => {
        content = nextContent;
        editor?.commands.setContent(nextContent, false);
        void docCommentsApi.listThreads(docId);
      },
      onPanelClose: () => {
        aiPanelManuallyClosed = true;
      }
    };
  }

  function handleAskAiSubmit(_prompt: string) {
    aiPanelManuallyClosed = false;
    openNoteAiFromAskAi(getNoteAiPanelProps());
  }

  function syncCommentsBridge() {
    docCommentsBridge.bindEditorContext({
      docId,
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
    docCommentsBridge.activeThreadId = activeThreadId;

    if (docCommentsBridge.pendingComposer !== pendingComposer) {
      docCommentsBridge.pendingComposer = pendingComposer;
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
    docCommentsBridge.reset();
    docCommentsApi.reset();
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
    const tags = await docsApi.updateDocTags(docId, nextTagIds);
    isSavingTags = false;

    if (!tags) {
      snackbar.error('docs.tags.save_error');
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
    await docsApi.updateDoc(docId, { content: nextContent });
    isSaving = false;
  }

  async function persistTitle(nextTitle: string) {
    isSaving = true;
    await docsApi.updateDoc(docId, { title: nextTitle });
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
    if (!(input instanceof HTMLTextAreaElement)) return;

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
    const deleted = await docsApi.deleteNote(docId);
    isDeleting = false;

    if (!deleted) {
      snackbar.error('docs.editor.delete_error');
      return;
    }

    snackbar.success('docs.editor.delete_success');
    showDeleteDialog = false;
    void goto(resolve(`${$currentOrgPath}/docs`, {}));
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
      await goto(resolve(`${$currentOrgPath}/docs/templates`, {}));
      return;
    }

    importInputRef?.click();
  }

  async function handleImportFile(file: File) {
    isImporting = true;
    const importedNote = await docsApi.importNote(file);
    isImporting = false;

    if (!importedNote) {
      snackbar.error('docs.org.import_error');
      return;
    }

    if (isNoteContentEmpty(content)) {
      await docsApi.deleteNote(docId);
    }

    snackbar.success('docs.org.import_success');
    emptyPagePickerDismissed = true;
    await goto(resolve(`${$currentOrgPath}/docs/${importedNote.id}`, {}));
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
    const converted = await docsApi.convertToTemplate(docId);

    if (!converted) {
      snackbar.error('docs.templates.convert_error');
      return;
    }

    snackbar.success('docs.templates.convert_copy_success');
    await docsApi.refreshList();
    await docsApi.listTemplates();
  }

  async function handleToggleFavorite() {
    if (isFavorited) {
      await docsApi.unfavoriteNote(docId);
      isFavorited = false;
      snackbar.success('docs.favorite.remove');
    } else {
      await docsApi.favoriteNote(docId);
      isFavorited = true;
      snackbar.success('docs.favorite.add');
    }

    await docsApi.listSidebar();
  }

  async function handleCoverUploaded(url: string) {
    isSavingCover = true;
    const updated = await docsApi.updateDoc(docId, { coverImageUrl: url });
    isSavingCover = false;

    if (!updated) {
      snackbar.error('docs.page.cover_upload_error');
      return;
    }

    coverImageUrl = updated.coverImageUrl ?? url;
    snackbar.success('docs.page.cover_upload_success');
  }

  async function handleCoverRemoved() {
    isSavingCover = true;
    const updated = await docsApi.updateDoc(docId, { coverImageUrl: null });
    isSavingCover = false;

    if (!updated) {
      snackbar.error('docs.page.cover_remove_error');
      return;
    }

    coverImageUrl = null;
    snackbar.success('docs.page.cover_remove_success');
  }

  async function handleCreateSubpage() {
    const created = await docsApi.createOrganizationDoc(t.get('docs.subpages.new'), docId);

    if (!created) {
      return;
    }

    childNotes = [...childNotes, created];
    await docsApi.listSidebar();
    await goto(resolve(`${$currentOrgPath}/docs/${created.id}`, {}));
  }

  function noteHref(targetNoteId: string) {
    return resolve(`${$currentOrgPath}/docs/${targetNoteId}`, {});
  }

  async function handleUnsetTemplate() {
    const updated = await docsApi.unsetTemplate(docId);

    if (!updated) {
      snackbar.error('docs.templates.remove_error');
      return;
    }

    isTemplateNote = false;
    snackbar.success('docs.templates.remove_success');
    await docsApi.refreshList();
    await docsApi.listTemplates();
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
    const payload = docCommentsBridge.pendingComposer ?? pendingComposer;

    if (!payload || !editor) {
      return;
    }
    const nextContent = editor.getHTML();

    const created = await docCommentsApi.createThread(docId, {
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
    const payload = docCommentsBridge.pendingComposer ?? pendingComposer;

    if (!editor || !payload) {
      pendingComposer = null;
      docCommentsBridge.pendingComposer = null;

      return;
    }

    editor.commands.unsetNoteComment({ threadId: payload.threadId });
    content = editor.getHTML();
    pendingComposer = null;
    docCommentsBridge.pendingComposer = null;
    activeThreadId = null;
  }

  async function handleResolveThread(thread: NoteCommentThread) {
    const nextContent = stripCommentMarkFromHtml(content, thread.id);
    content = nextContent;
    editor?.commands.setContent(nextContent, false);

    await docCommentsApi.updateThreadStatus(docId, thread.id, {
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

    await docCommentsApi.updateThreadStatus(docId, thread.id, {
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
    if (!docId) {
      return;
    }

    aiPanelManuallyClosed = false;
  });

  $effect(() => {
    if (isLoading || loadError || !canWrite || docOrigin !== 'organization' || !docId || aiPanelManuallyClosed) {
      return;
    }

    if (sidePanel.activePanelId === DOC_COMMENTS_PANEL_ID) {
      return;
    }

    if (sidePanel.activePanelId !== DOC_AI_PANEL_ID) {
      openNoteAiPanel(getNoteAiPanelProps());
    }
  });

  $effect(() => {
    const currentPanelId = sidePanel.activePanelId;

    if (previousSidePanelId === DOC_COMMENTS_PANEL_ID && currentPanelId === null && !aiPanelManuallyClosed) {
      if (!isLoading && !loadError && canWrite && docOrigin === 'organization' && docId) {
        openNoteAiPanel(getNoteAiPanelProps());
      }
    }

    previousSidePanelId = currentPanelId;
  });

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

      const mark = target.closest('[data-doc-comment]');

      if (!(mark instanceof HTMLElement) || !editorRoot.contains(mark)) {
        return;
      }

      const threadId = mark.getAttribute('data-doc-comment');

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
    if (!docId || !$currentOrg.id) {
      return;
    }

    emptyPagePickerDismissed = false;
    void loadNote();
  });

  $effect(() => {
    if (isLoading || loadError || !docId) {
      return;
    }

    disconnectCommentStream?.();
    disconnectCommentStream = connectNoteCommentStream(docId, () => {
      void docCommentsApi.listThreads(docId);
    });

    return () => {
      disconnectCommentStream?.();
      disconnectCommentStream = null;
    };
  });
</script>

<svelte:document onvisibilitychange={handleDocumentVisibilityChange} />

<div class="flex min-h-0 w-full flex-1 overflow-hidden">
  <div class="min-h-0 min-w-0 flex-1 overflow-y-auto">
    {#if isLoading}
      <div class="ui:text-muted-foreground flex h-40 items-center justify-center text-sm">
        <LoaderIcon size={18} class="mr-2 animate-spin" />
        {$t('docs.editor.loading')}
      </div>
    {:else if loadError}
      <p class="ui:text-destructive px-8 py-6 text-sm">{loadError}</p>
    {:else}
      <NotePageChrome
        {title}
        visibility={docVisibility}
        {coverImageUrl}
        {canWrite}
        {isSavingCover}
        onTitleInput={scheduleTitleSave}
        onTitleKeydown={handleTitleKeydown}
        onCoverUploaded={handleCoverUploaded}
        onCoverRemoved={handleCoverRemoved}
      >
        {#snippet actions()}
          {#if isSaving}
            <LoaderIcon size={16} class="ui:text-muted-foreground animate-spin" />
          {/if}

          {#if canWrite && docOrigin === 'organization'}
            <IconButton
              variant="secondary"
              size="icon"
              aria-label={$t('docs.share.open')}
              onclick={() => (showShareDialog = true)}
            >
              <ShareIcon size={16} />
            </IconButton>
          {/if}

          {#if canComment}
            <IconButton
              variant={commentsPanelOpen ? 'default' : 'secondary'}
              size="icon"
              aria-label={$t('docs.comments.heading')}
              onclick={toggleCommentsPanel}
            >
              <MessageSquareIcon size={16} />
            </IconButton>
          {/if}

          {#if canWrite}
            <DropdownMenu.Root>
              <DropdownMenu.Trigger>
                {#snippet child({ props })}
                  <IconButton {...props} variant="secondary" size="icon" aria-label={$t('docs.editor.more_actions')}>
                    <EllipsisVerticalIcon size={16} />
                  </IconButton>
                {/snippet}
              </DropdownMenu.Trigger>
              <DropdownMenu.Content align="end">
                {#if canWrite && docOrigin === 'organization'}
                  <DropdownMenu.Item onclick={() => (showConvertCourseDialog = true)}>
                    <BookOpenIcon size={16} />
                    {$t('docs.convert_course.button')}
                  </DropdownMenu.Item>
                {/if}
                <DropdownMenu.Item onclick={() => (showVersionHistory = true)}>
                  <HistoryIcon size={16} />
                  {$t('docs.editor.version_history.open')}
                </DropdownMenu.Item>
                {#if docOrigin === 'organization' && !isTemplateNote}
                  <DropdownMenu.Item onclick={handleConvertToTemplate}>
                    <LayoutTemplateIcon size={16} />
                    {$t('docs.editor.convert_to_template')}
                  </DropdownMenu.Item>
                {/if}
                {#if docOrigin === 'organization' && isTemplateNote}
                  <DropdownMenu.Item onclick={handleUnsetTemplate}>
                    <LayoutTemplateIcon size={16} />
                    {$t('docs.templates.remove_template')}
                  </DropdownMenu.Item>
                {/if}
                {#if docOrigin === 'organization' && canWrite && !isTemplateNote}
                  <DropdownMenu.Item onclick={handleToggleFavorite}>
                    <StarIcon size={16} class={isFavorited ? 'text-amber-500' : ''} />
                    {isFavorited ? $t('docs.favorite.remove') : $t('docs.favorite.add')}
                  </DropdownMenu.Item>
                {/if}
                {#if docOrigin === 'organization'}
                  <DropdownMenu.Separator />
                  <DropdownMenu.Item class="text-red-600" onclick={() => (showDeleteDialog = true)}>
                    <TrashIcon size={16} />
                    {$t('docs.editor.delete')}
                  </DropdownMenu.Item>
                {/if}
              </DropdownMenu.Content>
            </DropdownMenu.Root>
          {/if}
        {/snippet}

        {#snippet meta()}
          {#if docOrigin === 'organization' && (canWrite || docVisibility === 'public')}
            <p class="ui:text-muted-foreground text-sm">
              {$t('docs.page.public_views', { count: publicPageViews })}
            </p>
          {/if}

          {#if !canWrite && ownerFullname}
            <Badge variant="secondary" class="w-fit">{$t('docs.share.by_author', { name: ownerFullname })}</Badge>
          {/if}

          {#if !canWrite}
            <p class="ui:text-muted-foreground text-sm">
              {$t('docs.share.read_only_banner')}
            </p>
          {/if}

          {#if docOrigin === 'organization' && canWrite}
            <div class="flex flex-wrap items-center gap-2">
              <span class="ui:text-muted-foreground text-sm font-medium">{$t('docs.tags.heading')}</span>

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
        {/snippet}

        {#snippet children()}
          <div class="relative min-h-0 min-w-0 flex-1">
            <input
              bind:this={importInputRef}
              type="file"
              accept=".md,.txt,.docx,text/markdown,text/plain,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              class="hidden"
              onchange={handleImportInputChange}
            />

            {#if showEmptyPagePicker}
              <NoteEmptyPagePicker onSelect={handleEmptyPageOption} class="min-h-[40vh]" />
            {/if}

            <div class={showEmptyPagePicker ? 'sr-only' : 'notes-editor-surface'}>
              <TextEditor
                {content}
                showToolBar={false}
                editable={canWrite}
                frameless
                extraExtensions={commentExtensions}
                editorClass="min-h-[50vh] px-0 py-0"
                onChange={scheduleContentSave}
                onReady={handleEditorReady}
                placeholder={$t('docs.editor.placeholder')}
              />
            </div>

            {#if !showEmptyPagePicker}
              <NoteCommentSelection root={editorRoot} enabled={canComment} onComment={handleStartComment} />
              <p class="ui:text-muted-foreground mt-2 text-xs">{$t('docs.editor.slash_hint')}</p>
            {/if}

            {#if docOrigin === 'organization' && !showEmptyPagePicker}
              <NoteSubpages
                {docId}
                children={childNotes}
                {canWrite}
                {noteHref}
                onCreateChild={handleCreateSubpage}
              />
            {/if}

            {#if isImporting}
              <div class="ui:text-muted-foreground mt-2 flex items-center gap-2 text-sm">
                <LoaderIcon size={16} class="animate-spin" />
                {$t('docs.org.import')}
              </div>
            {/if}
          </div>
        {/snippet}
      </NotePageChrome>
    {/if}
  </div>
</div>

{#if showNoteAskAiBar}
  <ContentAskAiBar class="w-full max-w-3xl" onSubmit={handleAskAiSubmit} />
{/if}

<NoteConvertCourseDialog
  bind:open={showConvertCourseDialog}
  {docId}
  {docTitle}
  noteContent={content}
  {convertedCourseId}
  onConverted={(courseId) => {
    convertedCourseId = courseId;
  }}
/>

<NoteShareDialog
  {docId}
  {docTitle}
  ownerId={noteOwnerId}
  visibility={docVisibility}
  {docSlug}
  bind:open={showShareDialog}
  onVisibilityChange={(visibility, slug) => {
    docVisibility = visibility;
    docSlug = slug ?? null;
  }}
/>

<NoteVersionHistory
  {docId}
  open={showVersionHistory}
  onClose={() => (showVersionHistory = false)}
  onRestore={handleVersionRestore}
/>

<Dialog.Root bind:open={showDeleteDialog}>
  <Dialog.Content class="max-w-md">
    <Dialog.Header>
      <Dialog.Title>{$t('docs.editor.delete_title')}</Dialog.Title>
      <Dialog.Description>{$t('docs.editor.delete_description')}</Dialog.Description>
    </Dialog.Header>
    <Dialog.Footer>
      <Button variant="secondary" onclick={() => (showDeleteDialog = false)}>{$t('docs.share.cancel')}</Button>
      <Button variant="destructive" loading={isDeleting} onclick={handleDeleteNote}>
        {$t('docs.editor.delete_confirm')}
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
