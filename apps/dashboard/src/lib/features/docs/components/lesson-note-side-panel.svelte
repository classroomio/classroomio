<script lang="ts">
  import XIcon from '@lucide/svelte/icons/x';
  import ClockIcon from '@lucide/svelte/icons/clock';
  import LoaderIcon from '@lucide/svelte/icons/loader';
  import { resolve } from '$app/paths';
  import { Button } from '@cio/ui/base/button';
  import { IconButton } from '@cio/ui/custom/icon-button';
  import type { Content, TiptapEditor } from '@cio/ui/custom/editor';
  import { TextEditor } from '$features/ui';
  import { courseApi } from '$features/course/api';
  import { lessonVideoBus } from '$features/course/components/lesson/video/lesson-video-bus.svelte';
  import { getOrderedNavigableContent } from '$features/course/utils/content';
  import { sidePanel } from '$features/side-panel';
  import { ContentType } from '@cio/utils/constants/content';
  import { t } from '$lib/utils/functions/translations';
  import { docsApi } from '../api';

  interface Props {
    courseId: string;
    lessonId: string;
  }

  let { courseId, lessonId }: Props = $props();

  let editor: TiptapEditor | null = $state(null);
  let docId = $state<string | null>(null);
  let content = $state('');
  let isLoading = $state(true);
  let isSaving = $state(false);
  let loadError = $state<string | null>(null);
  let saveTimer: ReturnType<typeof setTimeout> | null = null;
  let editorContainer = $state<HTMLDivElement | null>(null);

  const currentLesson = $derived(
    getOrderedNavigableContent(courseApi.course).find(
      (item) => item.type === ContentType.Lesson && item.id === lessonId
    )
  );
  const lessonTitle = $derived(currentLesson?.title || courseApi.lesson?.title || 'Lesson');
  const lessonHref = $derived(resolve(`/courses/${courseId}/lessons/${lessonId}`, {}));
  const canInsertTimestamp = $derived(Boolean(lessonVideoBus.assetId));

  function formatTimestamp(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60)
      .toString()
      .padStart(2, '0');

    return `${minutes}:${remainingSeconds}`;
  }

  function bindEditor(instance: TiptapEditor) {
    editor = instance;
  }

  async function loadLessonNote() {
    isLoading = true;
    loadError = null;

    const note = await docsApi.ensureLessonCaptureNote({
      courseId,
      lessonId,
      title: lessonTitle
    });

    if (!note) {
      loadError = t.get('docs.lesson_panel.load_error');
      isLoading = false;

      return;
    }

    docId = note.id;
    content = note.content;
    isLoading = false;
  }

  async function persistNote(nextContent: string) {
    if (!docId) return;

    isSaving = true;
    await docsApi.updateDoc(docId, { content: nextContent });
    isSaving = false;
  }

  function scheduleSave(nextContent: Content) {
    const html = `${nextContent}`;
    content = html;

    if (saveTimer) {
      clearTimeout(saveTimer);
    }

    saveTimer = setTimeout(() => {
      void persistNote(html);
    }, 800);
  }

  function insertCurrentTimestamp() {
    if (!editor || !canInsertTimestamp) return;

    const startSeconds = Math.floor(lessonVideoBus.currentTimeSeconds);
    const label = formatTimestamp(startSeconds);
    const timestampLink = `<a data-note-anchor="video" data-asset-id="${lessonVideoBus.assetId}" data-start="${startSeconds}">${label}</a>`;

    editor.chain().focus().insertContent(`<p>${timestampLink}</p>`).run();

    scheduleSave(editor.getHTML());
  }

  function handleTimestampLinkClick(event: MouseEvent) {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;

    const anchor = target.closest('a[data-note-anchor="video"]');
    if (!(anchor instanceof HTMLAnchorElement)) return;

    const startValue = anchor.dataset.start;
    if (!startValue) return;

    const startSeconds = Number(startValue);
    if (!Number.isFinite(startSeconds)) return;

    event.preventDefault();
    lessonVideoBus.seek(startSeconds);
  }

  $effect(() => {
    courseId;
    lessonId;

    void loadLessonNote();
  });

  $effect(() => {
    const container = editorContainer;
    if (!container) return;

    container.addEventListener('click', handleTimestampLinkClick);

    return () => {
      container.removeEventListener('click', handleTimestampLinkClick);
    };
  });

  $effect(() => {
    return () => {
      if (saveTimer) {
        clearTimeout(saveTimer);
      }
    };
  });
</script>

<div class="flex min-h-0 flex-1 flex-col">
  <header class="border-border flex items-start justify-between gap-2 border-b px-4 py-3">
    <div class="min-w-0">
      <p class="truncate text-sm font-semibold">{lessonTitle}</p>
      <a href={lessonHref} class="ui:text-muted-foreground ui:hover:text-foreground truncate text-xs underline">
        {$t('docs.lesson_panel.view_lesson')}
      </a>
    </div>

    <div class="flex shrink-0 items-center gap-1">
      {#if isSaving}
        <LoaderIcon size={14} class="ui:text-muted-foreground animate-spin" />
      {/if}
      <IconButton variant="secondary" size="icon" onclick={() => sidePanel.close()}>
        <XIcon size={16} />
      </IconButton>
    </div>
  </header>

  <div class="flex items-center gap-2 border-b px-4 py-2">
    <Button variant="secondary" size="sm" disabled={!canInsertTimestamp} onclick={insertCurrentTimestamp}>
      <ClockIcon size={14} />
      {$t('docs.lesson_panel.insert_timestamp')}
    </Button>
    {#if !canInsertTimestamp}
      <span class="ui:text-muted-foreground text-xs">{$t('docs.lesson_panel.timestamp_hint')}</span>
    {/if}
  </div>

  <div bind:this={editorContainer} class="min-h-0 flex-1 overflow-y-auto p-3">
    {#if isLoading}
      <div class="ui:text-muted-foreground flex h-40 items-center justify-center text-sm">
        <LoaderIcon size={18} class="mr-2 animate-spin" />
        {$t('docs.lesson_panel.loading')}
      </div>
    {:else if loadError}
      <p class="ui:text-destructive text-sm">{loadError}</p>
    {:else}
      <div class="min-h-[50vh]">
        <TextEditor
          {content}
          showToolBar={true}
          frameless
          onChange={scheduleSave}
          onReady={bindEditor}
          placeholder={$t('docs.lesson_panel.placeholder')}
        />
      </div>
    {/if}
  </div>
</div>
