<script lang="ts">
  import { page } from '$app/state';
  import { resolve } from '$app/paths';
  import { dndzone } from 'svelte-dnd-action';
  import { Chip } from '@cio/ui/custom/chip';
  import { lessonApi, exerciseApi, courseApi, contentApi } from '$features/course/api';
  import { globalStore } from '$lib/utils/store/app';
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

  let courseId = $derived(courseApi.course?.id || '');
  const profileId = $derived($profile?.id || '');
  const contentData = $derived(getCourseContent(courseApi.course));

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

  $effect(() => {
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
  }

  async function handleDndFinalize(e: DndEvent) {
    const items = e.detail.items;
    contentItems = items;

    const contentUpdates: Array<{
      id: string;
      type: ContentType.Lesson | ContentType.Exercise;
      order: number;
      sectionId?: string | null;
    }> = [];

    items.forEach((item, index) => {
      const order = index + 1;

      if (item.type !== ContentType.Lesson && item.type !== ContentType.Exercise) {
        return;
      }

      if (item.order !== order) {
        item.order = order;
        contentUpdates.push({
          id: item.contentId,
          type: item.type,
          order,
          sectionId: item.sectionId ?? null
        });
      }
    });

    if (contentUpdates.length > 0) {
      await contentApi.updateContent(courseId, contentUpdates);
    }

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
  class="mx-auto w-full p-3 lg:w-11/12 lg:px-4"
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
    {@const lessonLocked = $globalStore.isStudent && !item.isUnlocked}
    {@const exerciseLocked = $globalStore.isStudent && (item.isUnlocked ?? true) === false}
    {@const lockLabel = item.isUnlocked
      ? $t('course.navItem.lessons.add_lesson.lock')
      : $t('course.navItem.lessons.add_lesson.unlock')}
    <div
      class="relative m-auto mb-4 flex max-w-xl items-center rounded-md border-2 border-gray-200 p-5 transition dark:bg-neutral-800 {reorder
        ? 'border-primary-300 bg-primary-50/40 cursor-move shadow-sm'
        : ''}"
    >
      <div class="mr-5">
        <Chip value={getContentOrder(item.contentId, item.type)} />
      </div>

      {#if item.type === ContentType.Lesson}
        <ContentRow
          {item}
          bind:title={item.title}
          href={resolve(
            lessonLocked ? page.url.pathname : `/courses/${courseApi.course?.id}/lessons/${item.contentId}`,
            {}
          )}
          isEditing={isEditingItem}
          {errors}
          containerClass="flex w-4/5 items-center"
          linkClass={`font-medium text-black no-underline hover:underline dark:text-white text-lg ${
            lessonLocked ? 'cursor-not-allowed' : ''
          }`}
          inputClass="max-w-lg"
          autoFocus={isEditingItem}
          showIcon={false}
        />
      {:else if item.type === ContentType.Exercise}
        <ContentRow
          {item}
          bind:title={item.title}
          href={resolve(
            exerciseLocked ? page.url.pathname : `/courses/${courseApi.course?.id}/exercises/${item.contentId}`,
            {}
          )}
          isEditing={isEditingItem}
          {errors}
          containerClass="flex w-4/5 items-center gap-2"
          linkClass={`font-medium text-black no-underline hover:underline dark:text-white text-lg ${
            exerciseLocked ? 'cursor-not-allowed opacity-50' : ''
          }`}
          inputClass="max-w-lg"
          autoFocus={isEditingItem}
          showStatus
          isLocked={exerciseLocked}
          isComplete={item.isComplete}
          iconSize={18}
        />
      {/if}

      <div class="flex flex-row">
        <ContentActions
          isEditing={isEditingItem}
          disabled={Boolean($contentEditingStore && !isEditingItem)}
          {lockLabel}
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
          onToggleLock={async () => {
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
          }}
        />
      </div>
    </div>
  {:else}
    <p class="text-center text-sm text-gray-500 dark:text-white">{$t('course.navItem.lessons.no_lesson')}</p>
  {/each}
</section>
