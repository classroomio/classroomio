<script lang="ts">
  import { page } from '$app/state';
  import { resolve } from '$app/paths';
  import { dndzone } from 'svelte-dnd-action';
  import CalendarClockIcon from '@lucide/svelte/icons/calendar-clock';
  import FileTextIcon from '@lucide/svelte/icons/file-text';
  import HelpCircleIcon from '@lucide/svelte/icons/help-circle';
  import LockIcon from '@lucide/svelte/icons/lock';
  import { Spinner } from '@cio/ui/base/spinner';
  import UnlockIcon from '@lucide/svelte/icons/lock-open';
  import VideoIcon from '@lucide/svelte/icons/video';
  import { HoverableItem, AttachmentIcon } from '@cio/ui/custom/moving-icons';
  import { Button } from '@cio/ui/base/button';
  import { Chip } from '@cio/ui/custom/chip';
  import { lessonApi, exerciseApi, courseApi, contentApi } from '$features/course/api';
  import { globalStore } from '$lib/utils/store/app';
  import formatDate from '$lib/utils/functions/formatDate';
  import { t } from '$lib/utils/functions/translations';
  import type { CourseContentItem } from '$features/course/utils/types';
  import { getCourseContent } from '$features/course/utils/content';
  import { ContentType } from '@cio/utils/constants/content';
  import { profile } from '$lib/utils/store/user';
  import { contentEditingStore } from '$features/course/components/content/store';
  import DeleteLessonConfirmation from '$features/course/components/lesson/delete-lesson-confirmation.svelte';
  import ContentRow from './content-row.svelte';
  import ContentActions from './content-actions.svelte';
  import { deleteContent, saveContent, toggleLock } from './content-action-helpers';

  const flipDurationMs = 300;

  interface Props {
    reorder?: boolean;
  }

  let { reorder = false }: Props = $props();

  let prevTitle: string | undefined = $state();
  let errors: Record<string, string> = $state({});
  let lessonToDelete: CourseContentItem | undefined = $state();
  let openDeleteModal = $state(false);
  let lockPendingItemKeys = $state<Record<string, boolean>>({});

  let courseId = $derived(courseApi.course?.id || '');
  const profileId = $derived($profile?.id || '');
  const contentData = $derived(getCourseContent(courseApi.course));
  const isStudentView = $derived($globalStore.isStudent === true);
  const isLiveCourse = $derived(courseApi.course?.type === 'LIVE_CLASS');
  const isSelfPacedCourse = $derived(courseApi.course?.type === 'SELF_PACED');
  const metaChipClass =
    'inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1 text-[10px] text-gray-700 dark:bg-neutral-700 dark:text-gray-200';

  type ContentDndItem = CourseContentItem & {
    id: string;
    contentId: string;
    isUnlocked?: boolean | null;
    isComplete?: boolean | null;
  };

  type DndEvent = CustomEvent<{ items: ContentDndItem[] }>;

  let contentItems = $state<ContentDndItem[]>([]);

  function buildContentItems(): ContentDndItem[] {
    return (contentData.items || []).map((item) => ({
      ...item,
      id: `${item.type}-${item.id}`,
      contentId: item.id
    }));
  }

  function syncCourseContentItems(items: ContentDndItem[]) {
    if (!courseApi.course?.content || courseApi.course.content.grouped) return;

    const updatedItems = items.map(({ contentId, id: _dndId, ...rest }, index) => ({
      ...rest,
      id: contentId,
      order: index + 1
    }));

    courseApi.course.content = {
      ...courseApi.course.content,
      items: updatedItems
    };
  }

  function normalizeSectionId(value?: string | null) {
    return value ? value : null;
  }

  async function applyPendingReorder() {
    if (!contentItems.length) return;

    const contentUpdates: Array<{
      id: string;
      type: ContentType.Lesson | ContentType.Exercise;
      order: number;
      sectionId?: string | null;
    }> = [];

    const updatedItems = contentItems.map((item, index) => {
      const order = index + 1;

      if (item.type === ContentType.Lesson || item.type === ContentType.Exercise) {
        if (item.order !== order) {
          contentUpdates.push({
            id: item.contentId,
            type: item.type,
            order,
            sectionId: normalizeSectionId(item.sectionId)
          });
        }
      }

      return {
        ...item,
        order
      };
    });

    contentItems = updatedItems;
    syncCourseContentItems(updatedItems);

    if (contentUpdates.length > 0) {
      await contentApi.updateContent(courseId, contentUpdates);
    }
  }

  let previousReorder = $state(false);

  $effect(() => {
    if (previousReorder && !reorder) {
      void applyPendingReorder();
    }
    previousReorder = reorder;

    if (!reorder || contentItems.length === 0) {
      contentItems = buildContentItems();
    }
  });

  async function saveLesson(item: ContentDndItem) {
    const nextErrors = await saveContent({
      item,
      courseId,
      lessonApi,
      exerciseApi
    });

    errors = nextErrors;

    if (Object.keys(nextErrors).length === 0) {
      resetEdit();
      syncCourseContentItems(contentItems);
    }
  }

  function resetEdit() {
    contentEditingStore.set(undefined);
    prevTitle = undefined;
    errors = {};
  }

  function handleDndConsider(e: DndEvent) {
    contentItems = e.detail.items;
    syncCourseContentItems(contentItems);
  }

  function handleDndFinalize(e: DndEvent) {
    const items = e.detail.items;
    contentItems = items;
    syncCourseContentItems(items);

    if (!reorder) {
      contentItems = buildContentItems();
    }
  }

  function getContentOrder(contentId: string, type: ContentType): number | string {
    const index = contentItems.findIndex((item) => item.type === type && item.contentId === contentId);

    if (index < 9) {
      return '0' + (index + 1);
    }

    return index + 1;
  }

  function getItemPath(item: ContentDndItem) {
    if (item.type === ContentType.Lesson) {
      return `/courses/${courseApi.course?.id}/lessons/${item.contentId}`;
    }

    return `/courses/${courseApi.course?.id}/exercises/${item.contentId}`;
  }

  function formatMetaDate(value?: string | null): string {
    if (!value) return '';
    return formatDate(value);
  }

  function isLockedForStudent(item: ContentDndItem, isStudent: boolean) {
    return isStudent && (item.isUnlocked ?? true) === false;
  }

  function getItemLockKey(item: ContentDndItem) {
    return `${item.type}-${item.contentId}`;
  }

  async function handleToggleItemLock(item: ContentDndItem) {
    const lockKey = getItemLockKey(item);
    if (lockPendingItemKeys[lockKey]) return;

    lockPendingItemKeys = {
      ...lockPendingItemKeys,
      [lockKey]: true
    };

    try {
      const lockErrors = await toggleLock({
        item,
        courseId,
        lessonApi,
        exerciseApi
      });
      errors = lockErrors;
      if (Object.keys(lockErrors).length === 0) {
        syncCourseContentItems(contentItems);
      }
    } finally {
      const nextPending = { ...lockPendingItemKeys };
      delete nextPending[lockKey];
      lockPendingItemKeys = nextPending;
    }
  }
</script>

<DeleteLessonConfirmation
  bind:openDeleteModal
  deleteLesson={async () => {
    if (!lessonToDelete?.id) return;
    const activeCourseId = courseApi.course?.id;
    if (!activeCourseId) return;

    const wasDeleted = await deleteContent({
      item: {
        type: lessonToDelete.type,
        contentId: lessonToDelete.id,
        title: lessonToDelete.title,
        isUnlocked: lessonToDelete.isUnlocked,
        sectionId: lessonToDelete.sectionId,
        order: lessonToDelete.order
      },
      courseId: activeCourseId,
      lessonApi,
      exerciseApi
    });

    if (wasDeleted && profileId) {
      await courseApi.refreshCourse(activeCourseId, profileId);
    }
  }}
/>

<section
  class="mx-auto w-full p-3 lg:w-11/12 lg:px-4 {reorder ? 'cursor-grab active:cursor-grabbing' : ''}"
  use:dndzone={{
    items: contentItems,
    flipDurationMs,
    dragDisabled: !reorder,
    dropTargetStyle: {
      border: '2px #1d4ed8 solid',
      'border-style': 'dashed'
    }
  }}
  onconsider={handleDndConsider}
  onfinalize={handleDndFinalize}
>
  {#each contentItems as item (item.id)}
    {@const isEditingItem = $contentEditingStore === item.contentId}
    {@const itemLocked = isLockedForStudent(item, isStudentView)}
    {@const lockLabel = item.isUnlocked
      ? $t('course.navItem.lessons.add_lesson.lock')
      : $t('course.navItem.lessons.add_lesson.unlock')}
    {@const canRenderJoinButton =
      item.type === ContentType.Lesson && isLiveCourse && Boolean(item.callUrl) && !itemLocked}
    {@const canRenderContinueButton = isStudentView && !itemLocked}
    {@const isLockPending = Boolean(lockPendingItemKeys[getItemLockKey(item)])}
    {@const actionDisabled = Boolean($contentEditingStore && !isEditingItem)}
    <div
      class="relative m-auto mb-4 flex max-w-xl items-start rounded-md border border-gray-200 px-3 py-2 transition dark:bg-neutral-800 {reorder
        ? 'border-primary-300 bg-primary-50/40 cursor-grab shadow-sm active:cursor-grabbing'
        : ''}"
    >
      <div class="mt-0.5 mr-5">
        <Chip value={getContentOrder(item.contentId, item.type)} />
      </div>

      {#if item.type === ContentType.Lesson}
        <ContentRow
          {item}
          bind:title={item.title}
          isLocked={itemLocked}
          href={resolve(itemLocked ? page.url.pathname : getItemPath(item), {})}
          isEditing={isEditingItem}
          {errors}
          autoFocus={isEditingItem}
        >
          {#snippet meta()}
            {@const hasVideos = (item.videosCount ?? 0) > 0}
            {@const hasDocuments = (item.documentsCount ?? 0) > 0}
            {@const hasNote = item.hasNoteContent === true}
            {@const hasSlide = item.hasSlideContent === true}
            {@const hasAnyMaterials = hasVideos || hasDocuments || hasNote || hasSlide}
            <div class="mt-2 flex flex-wrap items-center gap-1.5">
              {#if hasVideos}
                <span class={metaChipClass}>
                  <VideoIcon size={12} />
                  {item.videosCount}
                </span>
              {/if}

              {#if hasDocuments}
                <span class={metaChipClass}>
                  <FileTextIcon size={12} />
                  {item.documentsCount}
                </span>
              {/if}

              {#if hasNote}
                <span class={metaChipClass}>
                  <FileTextIcon size={12} />
                  {$t('course.navItem.lessons.materials.tabs.note.title')}
                </span>
              {/if}

              {#if hasSlide}
                <span class={metaChipClass}>
                  <FileTextIcon size={12} />
                  {$t('course.navItem.lessons.materials.tabs.slide.title')}
                </span>
              {/if}

              {#if !hasAnyMaterials}
                <HoverableItem>
                  {#snippet children(isHovered)}
                    <span class={metaChipClass}>
                      <AttachmentIcon size={11} {isHovered} />
                      {$t('course.navItem.lessons.materials.no_content')}
                    </span>
                  {/snippet}
                </HoverableItem>
              {/if}

              {#if isLiveCourse && item.lessonAt}
                <span class={metaChipClass}>
                  <CalendarClockIcon size={12} />
                  {formatMetaDate(item.lessonAt)}
                </span>
              {/if}

              {#if isStudentView}
                <span class={metaChipClass}>
                  {item.isComplete ? $t('course.navItem.lessons.complete') : $t('course.navItem.lessons.incomplete')}
                </span>
              {/if}
            </div>
          {/snippet}
        </ContentRow>
      {:else if item.type === ContentType.Exercise}
        <ContentRow
          {item}
          bind:title={item.title}
          isLocked={itemLocked}
          href={resolve(itemLocked ? page.url.pathname : getItemPath(item), {})}
          isEditing={isEditingItem}
          {errors}
          autoFocus={isEditingItem}
        >
          {#snippet meta()}
            <div class="mt-2 flex flex-wrap items-center gap-1.5">
              {#if !isStudentView && item.questionCount !== null}
                <span class={metaChipClass}>
                  <HelpCircleIcon size={12} />
                  {item.questionCount}
                  {$t('course.navItem.lessons.exercises.all_exercises.questions')}
                </span>
              {/if}

              {#if isSelfPacedCourse && item.dueBy}
                <span class={metaChipClass}>
                  <CalendarClockIcon size={12} />
                  {$t('course.navItem.lessons.exercises.all_exercises.view_mode.due')}: {formatMetaDate(item.dueBy)}
                </span>
              {/if}
            </div>
          {/snippet}
        </ContentRow>
      {/if}

      <div class="ml-3 flex min-w-fit items-start gap-2">
        {#if isStudentView}
          <span class="mt-1 inline-flex items-center text-gray-500 dark:text-gray-300">
            {#if itemLocked}
              <LockIcon size={16} />
            {:else}
              <UnlockIcon size={16} />
            {/if}
          </span>
        {:else}
          <Button
            size="icon-sm"
            variant="outline"
            class="h-8 w-8 text-gray-600"
            onclick={() => handleToggleItemLock(item)}
            disabled={actionDisabled || isEditingItem || isLockPending}
            aria-label={lockLabel}
            title={lockLabel}
          >
            {#if isLockPending}
              <Spinner class="h-5 w-5" />
            {:else if item.isUnlocked}
              <UnlockIcon class="h-5 w-5" />
            {:else}
              <LockIcon class="h-5 w-5" />
            {/if}
          </Button>
        {/if}

        {#if !isStudentView && canRenderJoinButton}
          <a href={item.callUrl!} target="_blank" rel="noreferrer" class="mt-0.5">
            <Button size="sm" variant="outline">{$t('schedule.join')}</Button>
          </a>
        {/if}

        {#if isStudentView && canRenderContinueButton && !isEditingItem}
          {#if canRenderJoinButton}
            <a href={item.callUrl!} target="_blank" rel="noreferrer">
              <Button size="sm">{$t('schedule.join')}</Button>
            </a>
          {:else}
            <a href={resolve(getItemPath(item), {})}>
              <Button size="sm" variant="outline">{$t('dashboard.continue')}</Button>
            </a>
          {/if}
        {/if}

        {#if !isStudentView}
          <ContentActions
            isEditing={isEditingItem}
            disabled={actionDisabled}
            {lockLabel}
            showLock={false}
            onEdit={() => {
              contentEditingStore.set(item.contentId);
              prevTitle = item.title;
            }}
            onSave={() => saveLesson(item)}
            onCancel={() => {
              item.title = prevTitle ?? item.title;
              resetEdit();
            }}
            onDelete={() => {
              lessonToDelete = item;
              openDeleteModal = true;
            }}
            onToggleLock={() => handleToggleItemLock(item)}
          />
        {/if}
      </div>
    </div>
  {:else}
    <p class="text-center text-sm text-gray-500 dark:text-white">{$t('course.navItem.lessons.no_lesson')}</p>
  {/each}
</section>
