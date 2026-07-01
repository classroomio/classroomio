<script lang="ts">
  import { page } from '$app/state';
  import { Button } from '@cio/ui/base/button';
  import { useSidebar } from '@cio/ui/base/sidebar';
  import { t } from '$lib/utils/functions/translations';
  import { sidePanel } from '$features/side-panel';
  import { LESSON_NOTE_PANEL_ID, openLessonNotePanel } from '../utils/open-lesson-note';

  const lessonId = $derived(page.params?.lessonId as string | undefined);
  const courseId = $derived(page.params?.id as string | undefined);
  const isLessonView = $derived(Boolean(lessonId && page.url.pathname.includes('/lessons/')));
  const sidebar = useSidebar();
  const isPanelOpen = $derived(sidePanel.activePanelId === LESSON_NOTE_PANEL_ID);

  function handleTakeNote() {
    if (!courseId || !lessonId) return;

    openLessonNotePanel({ courseId, lessonId });
  }
</script>

{#if isLessonView && sidebar.open && !sidebar.isMobile}
  <div class="px-2 pb-2">
    <Button variant="secondary" size="sm" class="w-full" onclick={handleTakeNote}>
      {isPanelOpen ? $t('notes.take_note.close') : $t('notes.take_note.open')}
    </Button>
  </div>
{/if}
