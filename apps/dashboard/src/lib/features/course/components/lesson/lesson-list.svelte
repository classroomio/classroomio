<script lang="ts">
  import { page } from '$app/state';
  import { resolve } from '$app/paths';
  import { dndzone } from 'svelte-dnd-action';
  import { Button } from '@cio/ui/base/button';
  import * as DropdownMenu from '@cio/ui/base/dropdown-menu';
  import EllipsisVerticalIcon from '@lucide/svelte/icons/ellipsis-vertical';
  import LockIcon from '@lucide/svelte/icons/lock';

  import { Chip } from '@cio/ui/custom/chip';
  import { InputField } from '@cio/ui/custom/input-field';
  import { RoleBasedSecurity } from '$features/ui';
  import { lessonApi } from '$features/course/api';
  import { ExerciseIcon } from '@cio/ui/custom/moving-icons';
  import { CircleCheckIcon } from '$features/ui/icons';

  import { globalStore } from '$lib/utils/store/app';
  import { courseApi, exerciseApi } from '$features/course/api';
  import { t } from '$lib/utils/functions/translations';
  import type { CourseContentItem } from '$features/course/utils/types';
  import { getCourseContent } from '$features/course/utils/content';
  import { ContentType } from '@cio/utils/constants/content';

  const flipDurationMs = 300;

  interface Props {
    reorder?: boolean;
    lessonEditing: string | undefined;
    lessonToDelete: CourseContentItem | undefined;
    openDeleteModal?: boolean;
  }

  let {
    reorder = false,
    lessonEditing = $bindable(),
    lessonToDelete = $bindable(),
    openDeleteModal = $bindable(false)
  }: Props = $props();

  let errors: Record<string, string> = $state({});

  let courseId = $derived(courseApi.course?.id || '');
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
    await lessonApi.update(courseId, item.contentId, {
      title: item.title || '',
      isUnlocked: item.isUnlocked ?? undefined,
      sectionId: item.sectionId ?? undefined,
      order: item.order ?? undefined
    });

    if (lessonApi.errors && Object.keys(lessonApi.errors).length) {
      // @ts-expect-error lessonApi errors are shaped at runtime
      errors = lessonApi.errors;
    } else {
      errors = {};
      lessonEditing = undefined;
      syncCourseContentItems(contentItems);
    }
  }

  function handleDndConsider(e: DndEvent) {
    contentItems = e.detail.items;
  }

  async function handleDndFinalize(e: DndEvent) {
    const items = e.detail.items;
    contentItems = items;

    const lessonUpdates: Array<{ id: string; order: number; sectionId?: string }> = [];
    const exerciseUpdates: Array<{ id: string; order: number }> = [];

    items.forEach((item, index) => {
      const order = index + 1;

      if (item.type === ContentType.Lesson) {
        if (item.order !== order) {
          item.order = order;
          lessonUpdates.push({ id: item.contentId, order, sectionId: item.sectionId ?? undefined });
        }
      }

      if (item.type === ContentType.Exercise) {
        if (item.order !== order) {
          item.order = order;
          exerciseUpdates.push({ id: item.contentId, order });
        }
      }
    });

    if (lessonUpdates.length > 0) {
      await lessonApi.reorderLessons(courseId, lessonUpdates);
    }

    if (exerciseUpdates.length > 0) {
      await Promise.all(
        exerciseUpdates.map((update) =>
          exerciseApi.update(courseId, update.id, {
            order: update.order
          })
        )
      );
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
    <div
      class="relative m-auto mb-4 flex max-w-xl items-center rounded-md border-2 border-gray-200 p-5 transition dark:bg-neutral-800 {reorder
        ? 'border-primary-300 bg-primary-50/40 cursor-move shadow-sm'
        : ''}"
    >
      <div class="mr-5">
        <Chip value={getContentOrder(item.contentId, item.type)} />
      </div>

      {#if item.type === ContentType.Lesson}
        <div class="w-4/5">
          {#if lessonEditing === item.contentId}
            <InputField bind:value={item.title} autoFocus={true} className="max-w-lg" errorMessage={errors?.title} />
          {:else}
            <h3 class="m-0 flex items-center text-lg dark:text-white">
              <a
                href={resolve(
                  $globalStore.isStudent && !item.isUnlocked
                    ? page.url.pathname
                    : `/courses/${courseApi.course?.id}/lessons/${item.contentId}`,
                  {}
                )}
                class="font-medium text-black no-underline hover:underline dark:text-white {$globalStore.isStudent &&
                !item.isUnlocked
                  ? 'cursor-not-allowed'
                  : ''}"
              >
                {item.title}
              </a>
            </h3>
          {/if}
        </div>

        <div class="flex flex-row">
          <RoleBasedSecurity allowedRoles={[1, 2]}>
            <DropdownMenu.Root>
              <DropdownMenu.Trigger>
                <Button variant="ghost" size="icon" class="h-8 w-8">
                  <EllipsisVerticalIcon class="h-5 w-5" />
                  <span class="sr-only">Open menu</span>
                </Button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Content align="end">
                <DropdownMenu.Item
                  onclick={async () => {
                    item.isUnlocked = !(item.isUnlocked ?? false);

                    await lessonApi.update(courseId, item.contentId, {
                      title: item.title || '',
                      isUnlocked: item.isUnlocked ?? undefined,
                      sectionId: item.sectionId ?? undefined
                    });
                    syncCourseContentItems(contentItems);
                  }}
                >
                  {item.isUnlocked
                    ? $t('course.navItem.lessons.add_lesson.lock')
                    : $t('course.navItem.lessons.add_lesson.unlock')}
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  onclick={() => {
                    if (lessonEditing === item.contentId) {
                      saveLesson(item);
                    } else {
                      lessonEditing = item.contentId;
                    }
                  }}
                >
                  {lessonEditing === item.contentId
                    ? $t('course.navItem.lessons.add_lesson.save')
                    : $t('course.navItem.lessons.add_lesson.edit')}
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  class="text-red-600 focus:text-red-600 dark:text-red-400"
                  onclick={() => {
                    lessonToDelete = item;
                    openDeleteModal = true;
                  }}
                >
                  {$t('course.navItem.lessons.add_lesson.delete')}
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Root>
          </RoleBasedSecurity>
        </div>
      {:else if item.type === ContentType.Exercise}
        {@const isLocked = $globalStore.isStudent && (item.isUnlocked ?? true) === false}
        <div class="flex w-full items-center justify-between gap-2">
          <div class="flex w-4/5 items-center gap-2">
            <ExerciseIcon size={18} />
            <h3 class="m-0 flex items-center text-lg dark:text-white">
              <a
                href={resolve(
                  isLocked ? page.url.pathname : `/courses/${courseApi.course?.id}/exercises/${item.contentId}`,
                  {}
                )}
                class="font-medium text-black no-underline hover:underline dark:text-white {isLocked
                  ? 'cursor-not-allowed opacity-50'
                  : ''}"
              >
                {item.title}
              </a>
            </h3>
            {#if isLocked}
              <LockIcon size={18} class="shrink-0" />
            {:else if item.isComplete}
              <span class="shrink-0">
                <CircleCheckIcon size={18} filled />
              </span>
            {/if}
          </div>
          <RoleBasedSecurity allowedRoles={[1, 2]}>
            <DropdownMenu.Root>
              <DropdownMenu.Trigger>
                <Button variant="ghost" size="icon" class="h-8 w-8">
                  <EllipsisVerticalIcon class="h-5 w-5" />
                  <span class="sr-only">Open menu</span>
                </Button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Content align="end">
                <DropdownMenu.Item
                  onclick={async () => {
                    item.isUnlocked = !(item.isUnlocked ?? true);

                    await exerciseApi.update(courseId, item.contentId, {
                      isUnlocked: item.isUnlocked ?? undefined
                    });
                    syncCourseContentItems(contentItems);
                  }}
                >
                  {item.isUnlocked
                    ? $t('course.navItem.lessons.add_lesson.lock')
                    : $t('course.navItem.lessons.add_lesson.unlock')}
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Root>
          </RoleBasedSecurity>
        </div>
      {/if}
    </div>
  {:else}
    <p class="text-center text-sm text-gray-500 dark:text-white">{$t('course.navItem.lessons.no_lesson')}</p>
  {/each}
</section>
