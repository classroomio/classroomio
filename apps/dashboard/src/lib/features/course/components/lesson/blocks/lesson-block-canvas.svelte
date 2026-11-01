<script lang="ts">
  import { BlockList } from '@cio/ui/custom/block-list';
  import type { AddContentChoice } from '@cio/ui/custom/add-content-menu';
  import { t } from '$lib/utils/functions/translations';
  import MODES from '$lib/utils/constants/mode';
  import { lessonApi } from '$features/course/api';
  import { lessonBlocksApi } from '$features/course/store/lesson-blocks.svelte';
  import { isOrgStudent } from '$lib/utils/store/app';
  import {
    DEFAULT_READING_DENSITY,
    getReadingDensitySpacingClass,
    isLessonBlockInsertType
  } from '$features/course/utils/lesson-blocks';
  import { lessonDocUpload, lessonVideoUpload } from '$features/course/components/lesson/store';
  import { addLessonBlock } from './lesson-add-block';
  import { getAddContentChoices } from './lesson-add-content-choices';
  import LessonAddContentRow from './lesson-add-content-row.svelte';
  import LessonBlockShell from './lesson-block-shell.svelte';
  import LessonDocumentBlock from './lesson-document-block.svelte';
  import LessonImageBlock from './lesson-image-block.svelte';
  import LessonNoteBlock from './lesson-note-block.svelte';
  import LessonSlideBlock from './lesson-slide-block.svelte';
  import LessonSlidePickerDialog from './lesson-slide-picker-dialog.svelte';
  import LessonVideoBlock from './lesson-video-block.svelte';
  import type { SlideEmbed } from '@cio/ui';
  import type { LessonBlock } from '$features/course/utils/types';

  interface Props {
    mode: (typeof MODES)[keyof typeof MODES];
    courseId: string;
    lessonId: string;
    learnerView?: boolean;
  }

  let { mode, courseId, lessonId, learnerView = false }: Props = $props();

  const DRAG_HINT_KEY = 'classroomio:lesson-block-drag-hint-dismissed';

  let slidePickerOpen = $state(false);
  let slidePickerIndex = $state(0);
  let slidePickerBlockId = $state<string | null>(null);

  const isEditing = $derived(mode === MODES.edit);
  const spacingClass = $derived(
    getReadingDensitySpacingClass(lessonApi.lesson?.readingDensity ?? DEFAULT_READING_DENSITY)
  );
  const emptyTitle = $derived(
    isEditing
      ? t.get('course.navItem.lessons.materials.blocks.empty_title')
      : t.get('course.navItem.lessons.materials.no_content')
  );
  const addChoices = $derived<AddContentChoice[]>(getAddContentChoices());

  const POLL_INTERVAL_MS = 10_000;

  let statusLessonId = '';
  let pollTimer: ReturnType<typeof setInterval> | undefined;

  function isEncoding() {
    return Object.values(lessonApi.videoHlsStatuses).some((status) => status === 'pending' || status === 'converting');
  }

  function stopPolling() {
    if (pollTimer) {
      clearInterval(pollTimer);
      pollTimer = undefined;
    }
  }

  async function refreshVideoStatuses() {
    await lessonApi.getVideoStatuses(courseId, lessonId);

    if (!isEncoding()) {
      stopPolling();
      return;
    }

    pollTimer ??= setInterval(() => void refreshVideoStatuses(), POLL_INTERVAL_MS);
  }

  const showsEncodingState = $derived(isEditing || $isOrgStudent !== true);

  $effect(() => {
    if (!showsEncodingState || !courseId || !lessonId || lessonId === statusLessonId) return;

    statusLessonId = lessonId;
    void refreshVideoStatuses();

    return stopPolling;
  });

  function handleAdd(type: string, index: number) {
    if (!isLessonBlockInsertType(type)) return;

    addLessonBlock(type, index, lessonApi.currentLocale);
  }

  function handleChange(block: LessonBlock) {
    if (block.type === 'video') {
      lessonBlocksApi.beginChangeVideo(block.id);
      $lessonVideoUpload.isModalOpen = true;
      return;
    }

    if (block.type === 'document') {
      lessonBlocksApi.beginChangeDocument(block.id);
      $lessonDocUpload.isModalOpen = true;
      return;
    }

    if (block.type === 'slide') {
      slidePickerIndex = lessonBlocksApi.blocks.findIndex((candidate) => candidate.id === block.id);
      slidePickerBlockId = block.id;
      slidePickerOpen = true;
    }
  }

  function getChangeLabel(type: 'video' | 'slide' | 'document'): string {
    const typeLabelKey =
      type === 'slide'
        ? 'course.navItem.lessons.materials.tabs.slide.title'
        : `course.navItem.lessons.materials.blocks.types.${type}`;

    return t.get('course.navItem.lessons.materials.blocks.change_type', { type: t.get(typeLabelKey) });
  }

  function handleSlideAdd(slide: SlideEmbed) {
    if (slidePickerBlockId) {
      lessonBlocksApi.replaceSlideBlock(slidePickerBlockId, slide);
    } else {
      lessonBlocksApi.addSlideBlock(slide, slidePickerIndex);
    }

    slidePickerBlockId = null;
  }
</script>

<BlockList
  items={lessonBlocksApi.blocks}
  editable={isEditing}
  {spacingClass}
  {addChoices}
  addLabel={t.get('course.navItem.lessons.materials.blocks.add_content')}
  {emptyTitle}
  emptyDescription={t.get('course.navItem.lessons.materials.blocks.empty_description')}
  previewLabel={isEditing || learnerView ? undefined : t.get('course.navItem.lessons.materials.blocks.preview_label')}
  scrollRailLabel={t.get('course.navItem.lessons.materials.blocks.scroll_rail')}
  goToBlockLabel={(index) => t.get('course.navItem.lessons.materials.blocks.go_to_block', { index })}
  itemTitle={(block) => block.type.toUpperCase()}
  dragHintLabel={t.get('course.navItem.lessons.materials.blocks.drag_hint')}
  dismissHintLabel={t.get('course.navItem.lessons.materials.blocks.dismiss_hint')}
  storageKey={DRAG_HINT_KEY}
  highlightId={lessonBlocksApi.lastInsertedBlockId}
  onAdd={handleAdd}
  onReorder={(blocks) => lessonBlocksApi.reorderBlocks(blocks)}
>
  {#snippet emptyAction()}
    <LessonAddContentRow onSelect={(type) => handleAdd(type, 0)} />
  {/snippet}

  {#snippet renderItem({ item: block, index, total, highlighted })}
    <LessonBlockShell
      {block}
      {index}
      {total}
      editable={isEditing}
      {highlighted}
      onRemove={() => lessonBlocksApi.removeBlock(block.id)}
      onMoveUp={() => lessonBlocksApi.moveBlock(block.id, -1)}
      onMoveDown={() => lessonBlocksApi.moveBlock(block.id, 1)}
    >
      {#if block.type === 'note'}
        <LessonNoteBlock {block} {mode} />
      {:else if block.type === 'video'}
        <LessonVideoBlock
          {block}
          {mode}
          {courseId}
          {lessonId}
          changeLabel={getChangeLabel('video')}
          onChange={() => handleChange(block)}
        />
      {:else if block.type === 'slide'}
        <LessonSlideBlock {block} {mode} changeLabel={getChangeLabel('slide')} onChange={() => handleChange(block)} />
      {:else if block.type === 'document'}
        <LessonDocumentBlock
          {block}
          {mode}
          changeLabel={getChangeLabel('document')}
          onChange={() => handleChange(block)}
        />
      {:else if block.type === 'image'}
        <LessonImageBlock {block} {mode} />
      {/if}
    </LessonBlockShell>
  {/snippet}
</BlockList>

<LessonSlidePickerDialog bind:open={slidePickerOpen} onAdd={handleSlideAdd} />
